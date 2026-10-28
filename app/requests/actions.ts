"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { dbInsert } from "@/lib/db";
import { REQUEST_TYPES, levelOf } from "@/lib/requests";
import { LEVELS } from "@/lib/submissions";
import { assignAndNotify } from "@/lib/assign";

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
  const className = clean(formData.get("class_name"), 40) || null;
  const picked = clean(formData.get("level"), 10);
  const level = LEVELS.includes(picked) ? picked : levelOf(className); // ใช้ระดับที่เลือก ถ้าไม่เลือกให้เดาจากช่องชั้น/ห้อง
  const base = { code, type, requester_name: name, contact, class_name: className, detail: clean(formData.get("detail"), 1500) || null, status: "รอดำเนินการ" };
  let { error } = await dbInsert("requests", { ...base, level }, true);
  // ฐานข้อมูลที่ยังไม่ได้รัน schema_v6.sql จะไม่มีคอลัมน์ level → บันทึกแบบเดิมเพื่อไม่ให้ยื่นคำร้องไม่ได้
  if (error && /level/i.test(error)) ({ error } = await dbInsert("requests", base, true));
  if (error) redirect("/requests?err=" + encodeURIComponent("ส่งคำร้องไม่สำเร็จ กรุณาลองใหม่"));
  // มอบหมายผู้รับผิดชอบตามกติกา + ส่งอีเมลแจ้งครู หลังตอบกลับผู้ยื่นแล้ว (ล้มเหลวไม่กระทบคำร้อง — สาเหตุจะแสดงที่ /admin/requests)
  after(async () => { try { await assignAndNotify(code, { level }); } catch (e) { console.error("assignAndNotify", e); } });
  revalidatePath("/admin/requests");
  redirect(`/requests?done=${code}`);
}
