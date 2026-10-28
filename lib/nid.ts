/* เลขบัตรประชาชน → อีเมลภายใน (HMAC) และวันเกิด → รหัสผ่านเริ่มต้น  (ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น) */
import { createHmac } from "crypto";

/** โดเมนอีเมลภายในของบัญชีที่ล็อกอินด้วยเลขบัตร (ไม่ตรงกับ @nonghanwit.ac.th จึงไม่ถูกให้สิทธิ์ครูอัตโนมัติ) */
export const STAFF_DOMAIN = process.env.STAFF_LOGIN_DOMAIN || "id.nonghanwit.ac.th";

export const isStaffLoginEmail = (e?: string | null) => !!e && e.toLowerCase().endsWith("@" + STAFF_DOMAIN);

/** รับเลขบัตรที่พิมพ์มา (อนุญาตเว้นวรรค/ขีด) → 13 หลัก หรือ null */
export function normalizeNid(s: string): string | null {
  const d = s.replace(/[\s-]/g, "");
  return /^\d{13}$/.test(d) ? d : null;
}

/** ตรวจหลักตรวจสอบ (หลักที่ 13) ของเลขบัตรประชาชนไทย */
export function validNid(n: string): boolean {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(n[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === Number(n[12]);
}

/** แปลงเป็นอีเมลภายใน — คืน null ถ้ายังไม่ได้ตั้งค่า NATIONAL_ID_SECRET */
export function nidToEmail(nid: string): string | null {
  const secret = process.env.NATIONAL_ID_SECRET;
  if (!secret || secret.length < 16) return null;
  const h = createHmac("sha256", secret).update(nid).digest("hex").slice(0, 32);
  return `t${h}@${STAFF_DOMAIN}`;
}

/** วันเกิด (15/04/2530 หรือ 15042530; ปี พ.ศ. หรือ ค.ศ. ก็ได้) → รหัสผ่านรูปแบบ ววดดปปปป (พ.ศ.) */
export function birthToPassword(input: string): string | null {
  const t = input.trim();
  let d: string, m: string, y: string;
  if (/^\d{8}$/.test(t)) [d, m, y] = [t.slice(0, 2), t.slice(2, 4), t.slice(4)];
  else {
    const p = t.split(/[\/\-.\s]+/);
    if (p.length !== 3 || !p.every((x) => /^\d+$/.test(x))) return null;
    [d, m, y] = p;
  }
  if (y.length !== 4) return null;
  const yr = Number(y);
  const be = yr < 2400 ? yr + 543 : yr;
  const ce = be - 543;
  const now = new Date().getUTCFullYear();
  if (ce < 1920 || ce > now - 16) return null;
  const dd = Number(d), mm = Number(m);
  const dt = new Date(Date.UTC(ce, mm - 1, dd));
  if (dt.getUTCFullYear() !== ce || dt.getUTCMonth() !== mm - 1 || dt.getUTCDate() !== dd) return null;
  return String(dd).padStart(2, "0") + String(mm).padStart(2, "0") + String(be);
}
