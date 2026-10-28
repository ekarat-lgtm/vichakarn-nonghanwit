"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const fail = (m: string): never => redirect("/account/password?error=" + encodeURIComponent(m));

export async function changePassword(formData: FormData) {
  const sb = await createClient();
  if (!sb) return redirect("/login");
  const { data } = await sb.auth.getUser();
  if (!data.user) return redirect("/login");

  const pw = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (pw.length < 8) fail("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
  if (/^\d+$/.test(pw)) fail("รหัสผ่านต้องมีตัวอักษรอย่างน้อย 1 ตัว (ห้ามเป็นตัวเลขล้วน เช่น วันเกิด)");
  if (pw !== confirm) fail("รหัสผ่านทั้งสองช่องไม่ตรงกัน");

  const { error } = await sb.auth.updateUser({ password: pw });
  if (error) fail("เปลี่ยนรหัสผ่านไม่สำเร็จ: " + error.message);
  await sb.rpc("clear_must_change_password"); // ปลดธงบังคับเปลี่ยนรหัส (ต้องรัน schema_v3.sql)
  redirect("/");
}
