/* ไคลเอนต์สิทธิ์สูงสุด (service role) — ใช้ใน Server Action ของแอดมินเท่านั้น ห้ามส่งไปฝั่งเบราว์เซอร์ */
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
