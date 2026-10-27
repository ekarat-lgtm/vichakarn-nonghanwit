"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hasSupabase } from "@/lib/supabase/server";

export async function setDemoRole(formData: FormData) {
  if (hasSupabase) redirect("/");
  const role = String(formData.get("role") ?? "admin");
  if (!["anon", "teacher", "editor", "admin"].includes(role)) redirect("/");
  (await cookies()).set("demo_role", role, { path: "/", maxAge: 60 * 60 * 8 });
  revalidatePath("/", "layout");
  let back = "/";
  try {
    const ref = (await headers()).get("referer");
    if (ref) { const u = new URL(ref); back = u.pathname + u.search; }
  } catch {}
  // ถ้าสิทธิ์ใหม่เข้าหน้าปัจจุบันไม่ได้ ให้ไปหน้าแรก
  if (back.startsWith("/admin") && !["editor", "admin"].includes(role)) back = "/";
  if (back.startsWith("/tracking") && role === "anon") back = "/";
  redirect(back);
}
