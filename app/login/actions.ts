"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const sb = await createClient();
  if (!sb) redirect("/login?error=" + encodeURIComponent("ยังไม่ได้ตั้งค่า Supabase (ดู README)"));
  const { error } = await sb.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) redirect("/login?error=" + encodeURIComponent("อีเมลหรือรหัสผ่านไม่ถูกต้อง"));
  redirect("/");
}

export async function logout() {
  const sb = await createClient();
  await sb?.auth.signOut();
  redirect("/");
}
