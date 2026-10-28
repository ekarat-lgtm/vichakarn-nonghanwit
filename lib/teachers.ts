/* ตัวช่วยเกี่ยวกับข้อมูลครู: กลุ่มสาระ / อีเมลแจ้งเตือน */
import { LEARNING_AREAS } from "@/lib/submissions";

export const isEmail = (s: string) => s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/** จับคู่ชื่อกลุ่มสาระที่พิมพ์/วางมา (ตรงตัว หรือพิมพ์บางส่วนที่ไม่กำกวม เช่น "วิทยาศาสตร์") — ไม่พบคืน null */
export function matchArea(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (LEARNING_AREAS.includes(s)) return s;
  const hits = LEARNING_AREAS.filter((a) => a.startsWith(s) || (s.length >= 3 && a.includes(s)));
  return hits.length === 1 ? hits[0] : null;
}

type P = { contact_email?: string | null; email?: string | null; id_hint?: string | null };
/** อีเมลที่ใช้แจ้งเตือนครู: ใช้ช่องอีเมลที่แอดมินกรอก; ถ้าว่างและเป็นบัญชีอีเมลจริง (ไม่ใช่บัญชีเลขบัตร) ใช้อีเมลล็อกอิน */
export function notifyEmailOf(p: P): string | null {
  const c = (p.contact_email ?? "").trim();
  if (c) return c;
  if (!p.id_hint && p.email && isEmail(p.email) && !p.email.endsWith("@demo")) return p.email;
  return null;
}
