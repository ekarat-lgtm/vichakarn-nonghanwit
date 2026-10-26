import { createClient } from "@supabase/supabase-js";

/** ไคลเอนต์สำหรับอ่านข้อมูลสาธารณะ (ไม่ผูกคุกกี้) — ใช้ร่วมกับ unstable_cache ให้โหลดเร็ว */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
