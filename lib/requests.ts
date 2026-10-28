export const REQUEST_TYPES = [
  "ขอแก้ผลการเรียน (0 / ร / มส)",
  "ขอเอกสาร ปพ.1 / ใบรับรองผลการเรียน",
  "ขอเอกสาร ปพ.7 / ใบรับรองสถานภาพนักเรียน",
  "ขอเปลี่ยนแปลงข้อมูลนักเรียน",
  "ขอสอบแก้ตัว / สอบวัดผลย้อนหลัง",
  "อื่น ๆ",
];
export const REQUEST_STATUSES = ["รอดำเนินการ", "กำลังดำเนินการ", "เสร็จสิ้น", "ไม่อนุมัติ"];

export const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " น." : "";

const cut = (v: string | null | undefined) => { const t = (v ?? "").trim(); return t ? (t.length > 80 ? t.slice(0, 80) + "…" : `“${t}”`) : "(ว่าง)"; };
/** สรุปสิ่งที่เปลี่ยนในแต่ละครั้งที่แก้คำร้อง */
export function describeLog(l: { from_status?: string | null; to_status?: string | null; from_response?: string | null; to_response?: string | null }): string[] {
  const out: string[] = [];
  if ((l.from_status ?? "") !== (l.to_status ?? "")) out.push(`สถานะ: ${l.from_status ?? "-"} → ${l.to_status ?? "-"}`);
  if ((l.from_response ?? "") !== (l.to_response ?? "")) out.push(`ข้อความตอบกลับ: ${cut(l.from_response)} → ${cut(l.to_response)}`);
  return out;
}

import { hasSupabase } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { demoRows } from "@/lib/store";

export type TrackedRequest = { code: string; type: string; status: string; response: string | null; created_at: string; updated_at: string | null };

/** ตรวจสถานะคำร้องด้วยรหัส (แสดงเฉพาะสถานะ ไม่แสดงข้อมูลส่วนตัว) */
export async function trackRequest(code: string): Promise<TrackedRequest | null> {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  if (!hasSupabase) {
    const r = demoRows("requests").find((x) => x.code === c);
    return r ? { code: r.code, type: r.type, status: r.status, response: r.response ?? null, created_at: r.created_at, updated_at: r.updated_at ?? null } : null;
  }
  const sb = createPublicClient();
  if (!sb) return null;
  const { data } = await sb.rpc("track_request", { p_code: c });
  return ((data as TrackedRequest[] | null) ?? [])[0] ?? null;
}
