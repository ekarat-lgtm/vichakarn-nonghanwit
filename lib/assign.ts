/* มอบหมายผู้รับผิดชอบคำร้อง + ส่งอีเมลแจ้งเตือน (ฝั่งเซิร์ฟเวอร์) — ใช้ service role เพราะผู้ยื่นคำร้องเป็นผู้เยี่ยมชม
   ล้มเหลวเงียบ ๆ ได้ (ไม่กระทบการยื่นคำร้อง) แต่จะบันทึกสาเหตุไว้ที่ requests.notify_error ให้แอดมินเห็น */
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabase } from "@/lib/supabase/server";
import { demo, type Row } from "@/lib/store";
import { sendMail, esc, mailConfigured } from "@/lib/mailer";
import { ANY_LEVEL, fmtDateTime, levelOf } from "@/lib/requests";
import { notifyEmailOf } from "@/lib/teachers";

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;
const needAdmin = (): Admin | string => createAdminClient() ?? "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY";

async function loadRequest(code: string): Promise<Row | null> {
  if (!hasSupabase) return demo().requests?.find((r) => r.code === code) ?? null;
  const a = needAdmin(); if (typeof a === "string") return null;
  const { data } = await a.from("requests").select("*").eq("code", code).maybeSingle();
  return data;
}
async function patchRequest(code: string, patch: Row) {
  if (!hasSupabase) { const r = demo().requests?.find((x) => x.code === code); if (r) Object.assign(r, patch); return; }
  const a = needAdmin(); if (typeof a === "string") return;
  await a.from("requests").update(patch).eq("code", code);
}
async function loadTeacher(id: string): Promise<Row | null> {
  if (!hasSupabase) return demo().profiles?.find((p) => p.id === id) ?? null;
  const a = needAdmin(); if (typeof a === "string") return null;
  const { data } = await a.from("profiles").select("*").eq("id", id).maybeSingle();
  return data;
}
/** กติกาที่ตรงที่สุด: ระดับชั้นเดียวกันก่อน ไม่มีค่อยใช้ "ทุกระดับ" */
async function ruleTeacherId(type: string, level: string | null): Promise<string | null> {
  const levels = level ? [level, ANY_LEVEL] : [ANY_LEVEL];
  let rules: Row[];
  if (!hasSupabase) rules = (demo().request_assignees ?? []).filter((r) => r.request_type === type && levels.includes(r.level));
  else {
    const a = needAdmin(); if (typeof a === "string") return null;
    const { data } = await a.from("request_assignees").select("level,teacher_id").eq("request_type", type).in("level", levels);
    rules = data ?? [];
  }
  return (rules.find((r) => r.level === level) ?? rules.find((r) => r.level === ANY_LEVEL))?.teacher_id ?? null;
}

const siteUrl = () => process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");

function compose(req: Row, teacher: Row, level: string | null) {
  const canOpen = teacher.role === "editor" || teacher.role === "admin"; // ครูทั่วไปเปิดหลังบ้านไม่ได้ จึงไม่ใส่ลิงก์
  const link = canOpen && siteUrl() ? `${siteUrl()}/admin/requests` : "";
  const rows: [string, string][] = [
    ["รหัสคำร้อง", req.code], ["ประเภท", req.type], ["ผู้ยื่น", req.requester_name],
    ["ชั้น/ห้อง", req.class_name || level || "-"],
    ["ติดต่อกลับ", req.contact || "-"], ["ยื่นเมื่อ", fmtDateTime(req.created_at)], ["รายละเอียด", req.detail || "-"],
  ];
  const name = teacher.full_name ?? "";
  const text = [`เรียน ${name}`, "", "มีคำร้องใหม่ที่ได้รับมอบหมายให้คุณเป็นผู้ดูแล กรุณาดำเนินการต่อ", "",
    ...rows.map(([k, v]) => `${k}: ${v}`), ...(link ? ["", `จัดการคำร้อง: ${link}`] : []), "",
    "— อีเมลอัตโนมัติจากเว็บไซต์งานวิชาการ โรงเรียนหนองหานวิทยา (ข้อมูลผู้ยื่นเป็นข้อมูลส่วนบุคคล โปรดใช้เพื่อดำเนินการคำร้องนี้เท่านั้น)"].join("\n");
  const html = `<div style="font-family:Sarabun,Tahoma,sans-serif;line-height:1.6;color:#222">
<p>เรียน ${esc(name)}</p><p>มีคำร้องใหม่ที่ได้รับมอบหมายให้คุณเป็นผู้ดูแล กรุณาดำเนินการต่อ</p>
<table style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:4px 14px 4px 0;color:#666;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:4px 0;white-space:pre-wrap">${esc(String(v))}</td></tr>`).join("")}</table>
${link ? `<p><a href="${esc(link)}">เปิดหน้าจัดการคำร้อง</a></p>` : ""}
<p style="color:#888;font-size:.85em">อีเมลอัตโนมัติจากเว็บไซต์งานวิชาการ โรงเรียนหนองหานวิทยา · ข้อมูลผู้ยื่นเป็นข้อมูลส่วนบุคคล โปรดใช้เพื่อดำเนินการคำร้องนี้เท่านั้น</p></div>`;
  return { subject: `[คำร้องใหม่] ${req.type} · ${req.code}`, text, html };
}

/** หาผู้รับผิดชอบตามกติกา (หรือใช้ forceTeacherId) → บันทึกลงคำร้อง → ส่งอีเมลแจ้งครู */
export async function assignAndNotify(code: string, opts: { teacherId?: string; level?: string | null } = {}): Promise<{ ok: boolean; message: string }> {
  const req = await loadRequest(code);
  if (!req) return { ok: false, message: "ไม่พบคำร้อง (หรือยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY)" };
  const level: string | null = opts.level ?? req.level ?? levelOf(req.class_name);
  const teacherId = opts.teacherId ?? (await ruleTeacherId(req.type, level));
  if (!teacherId) return { ok: false, message: "ยังไม่ได้กำหนดผู้รับผิดชอบสำหรับคำร้องประเภท/ระดับนี้" };
  const teacher = await loadTeacher(teacherId);
  if (!teacher) return { ok: false, message: "ไม่พบบัญชีผู้รับผิดชอบ" };

  await patchRequest(code, { assignee_id: teacher.id, assignee_name: teacher.full_name, notified_at: null, notify_error: null });
  const to = notifyEmailOf(teacher);
  if (!to) {
    await patchRequest(code, { notify_error: "ผู้รับผิดชอบยังไม่มีอีเมล" });
    return { ok: false, message: `มอบหมายให้ ${teacher.full_name} แล้ว แต่ยังไม่ได้ส่งอีเมล เพราะบัญชีนี้ไม่มีอีเมล (เพิ่มได้ที่ ผู้ใช้/สิทธิ์)` };
  }
  if (!mailConfigured()) {
    await patchRequest(code, { notify_error: "ยังไม่ได้ตั้งค่า SMTP_USER / SMTP_PASS" });
    return { ok: false, message: `มอบหมายให้ ${teacher.full_name} แล้ว แต่ยังไม่ได้ตั้งค่า SMTP_USER / SMTP_PASS จึงส่งอีเมลไม่ได้` };
  }
  try {
    await sendMail({ to, ...compose(req, teacher, level) });
    await patchRequest(code, { notified_at: new Date().toISOString() });
    return { ok: true, message: `มอบหมายให้ ${teacher.full_name} และส่งอีเมลแจ้งแล้ว` };
  } catch (e) {
    const why = (e instanceof Error ? e.message : String(e)).slice(0, 200);
    await patchRequest(code, { notify_error: why });
    return { ok: false, message: `มอบหมายให้ ${teacher.full_name} แล้ว แต่ส่งอีเมลไม่สำเร็จ: ${why}` };
  }
}
