"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { nidToEmail, normalizeNid } from "@/lib/nid";

export async function login(formData: FormData) {
  const sb = await createClient();
  if (!sb) redirect("/login?error=" + encodeURIComponent("ยังไม่ได้ตั้งค่า Supabase (ดู README)"));
  // ช่องเดียวรับได้ทั้งเลขบัตรประชาชน 13 หลัก (ครู) หรืออีเมล (แอดมินกลาง/บัญชีเดิม)
  const raw = String(formData.get("username") ?? "").trim();
  const nid = normalizeNid(raw);
  let email = raw;
  if (nid) {
    const e = nidToEmail(nid);
    if (!e) redirect("/login?error=" + encodeURIComponent("ระบบยังไม่ได้ตั้งค่าการเข้าสู่ระบบด้วยเลขบัตร กรุณาแจ้งผู้ดูแล"));
    email = e;
  }
  const { error } = await sb.auth.signInWithPassword({ email, password: String(formData.get("password") ?? "") });
  if (error) redirect("/login?error=" + encodeURIComponent("เลขบัตร/อีเมล หรือรหัสผ่านไม่ถูกต้อง"));
  redirect("/");
}

export async function logout() {
  const sb = await createClient();
  await sb?.auth.signOut();
  redirect("/");
}
