/* สร้าง/รีเซ็ตบัญชีครู (ล็อกอินด้วยเลขบัตร รหัสเริ่มต้น = วันเกิด) — คืนข้อความผิดพลาด หรือ null เมื่อสำเร็จ */
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabase } from "@/lib/supabase/server";
import { dbInsert } from "@/lib/db";
import { birthToPassword, normalizeNid, nidToEmail, validNid } from "@/lib/nid";
import { LEARNING_AREAS } from "@/lib/submissions";
import { isEmail } from "@/lib/teachers";

export const STAFF_ROLES = ["teacher", "editor", "admin"] as const;
export type StaffInput = { nid: string; name: string; birth: string; role: string; area: string; email?: string };

const NEED_ENV = "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY และ NATIONAL_ID_SECRET (ดู README หัวข้อ “บัญชีครูด้วยเลขบัตร”)";

function check(i: StaffInput) {
  const nid = normalizeNid(i.nid);
  if (!nid) return { error: "เลขบัตรต้องเป็นตัวเลข 13 หลัก" } as const;
  if (!validNid(nid)) return { error: "เลขบัตรไม่ถูกต้อง (หลักตรวจสอบไม่ผ่าน)" } as const;
  const password = birthToPassword(i.birth);
  if (!password) return { error: "วันเกิดไม่ถูกต้อง (รูปแบบ วว/ดด/ปปปป เช่น 15/04/2530)" } as const;
  return { nid, password, error: undefined } as const;
}

export async function createStaff(i: StaffInput): Promise<string | null> {
  const name = i.name.trim();
  if (!name) return "กรุณากรอกชื่อ-สกุล";
  if (!(STAFF_ROLES as readonly string[]).includes(i.role)) return "สิทธิ์ไม่ถูกต้อง";
  if (!LEARNING_AREAS.includes(i.area)) return "กรุณาเลือกกลุ่มสาระการเรียนรู้ให้ตรงกับรายการ";
  const email = (i.email ?? "").trim().toLowerCase();
  if (email && !isEmail(email)) return "รูปแบบอีเมลไม่ถูกต้อง";
  const c = check(i);
  if (c.error) return c.error;

  if (!hasSupabase) { // โหมดเดโม: เพิ่มในหน่วยความจำ
    const r = await dbInsert("profiles", { email: `id-${c.nid.slice(-4)}@demo`, full_name: name, role: i.role, id_hint: c.nid.slice(-4), must_change_password: true, learning_area: i.area, contact_email: email || null });
    return r.error ?? null;
  }

  const loginEmail = nidToEmail(c.nid);
  const admin = createAdminClient();
  if (!loginEmail || !admin) return NEED_ENV;

  const { data, error } = await admin.auth.admin.createUser({
    email: loginEmail, password: c.password, email_confirm: true, user_metadata: { full_name: name },
  });
  if (error || !data.user) {
    return /already|registered|exists/i.test(error?.message ?? "") ? "เลขบัตรนี้มีบัญชีอยู่แล้ว" : "สร้างบัญชีไม่สำเร็จ: " + (error?.message ?? "");
  }
  const { error: e2 } = await admin.from("profiles").upsert({
    id: data.user.id, email: loginEmail, full_name: name, role: i.role, must_change_password: true, id_hint: c.nid.slice(-4),
    learning_area: i.area, contact_email: email || null,
  });
  if (e2) {
    await admin.auth.admin.deleteUser(data.user.id); // ไม่ให้เหลือบัญชีที่ไม่มีโปรไฟล์
    return "บันทึกโปรไฟล์ไม่สำเร็จ (รัน supabase/schema_v3.sql และ schema_v6.sql แล้วหรือยัง?): " + e2.message;
  }
  return null;
}

/** ตั้งรหัสผ่านกลับเป็นวันเกิด และบังคับให้เปลี่ยนใหม่ตอนล็อกอินครั้งถัดไป (ใช้เมื่อครูลืมรหัส) */
export async function resetStaffPassword(userId: string, birth: string): Promise<string | null> {
  const password = birthToPassword(birth);
  if (!password) return "วันเกิดไม่ถูกต้อง (รูปแบบ วว/ดด/ปปปป เช่น 15/04/2530)";
  if (!hasSupabase) return null;
  const admin = createAdminClient();
  if (!admin) return NEED_ENV;
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return "รีเซ็ตไม่สำเร็จ: " + error.message;
  const { error: e2 } = await admin.from("profiles").update({ must_change_password: true }).eq("id", userId);
  return e2 ? e2.message : null;
}
