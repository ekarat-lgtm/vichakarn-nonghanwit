"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { dbInsert } from "@/lib/db";
import { REQUEST_TYPES } from "@/lib/requests";

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

export async function submitRequest(formData: FormData) {
  if (clean(formData.get("website"), 10)) redirect("/requests"); // honeypot กันบอท
  const type = clean(formData.get("type"), 100);
  const name = clean(formData.get("requester_name"), 120);
  const contact = clean(formData.get("contact"), 80);
  if (!REQUEST_TYPES.includes(type) || !name || !contact) {
    redirect("/requests?err=" + encodeURIComponent("กรุณากรอกประเภทคำร้อง ชื่อ-สกุล และช่องทางติดต่อ"));
  }
  const yy = String((new Date().getFullYear() + 543) % 100).padStart(2, "0");
  const rand = Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
  const code = `RQ-${yy}-${rand}`;
  const { error } = await dbInsert("requests", {
    code, type, requester_name: name, contact,
    class_name: clean(formData.get("class_name"), 40) || null,
    detail: clean(formData.get("detail"), 1500) || null,
    status: "รอดำเนินการ",
  }, true);
  if (error) redirect("/requests?err=" + encodeURIComponent("ส่งคำร้องไม่สำเร็จ กรุณาลองใหม่"));
  revalidatePath("/admin/requests");
  redirect(`/requests?done=${code}`);
}
