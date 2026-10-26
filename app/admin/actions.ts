"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findTable } from "@/lib/adminConfig";
import { settingDefs } from "@/lib/school";
import { getSession, isEditor } from "@/lib/data";

async function guard() {
  const { role } = await getSession();
  if (!isEditor(role)) redirect("/login");
  const sb = await createClient();
  if (!sb) redirect("/admin?msg=" + encodeURIComponent("ยังไม่ได้ตั้งค่า Supabase"));
  return sb;
}

const back = (table: string, msg: string, err = false) =>
  redirect(`/admin/${table}?${err ? "err" : "msg"}=${encodeURIComponent(msg)}`);

export async function createRow(table: string, formData: FormData) {
  const cfg = findTable(table);
  if (!cfg) redirect("/admin");
  const sb = await guard();

  const row: Record<string, unknown> = {};
  for (const f of cfg.fields) {
    if (f.type === "file") continue;
    const v = String(formData.get(f.name) ?? "").trim();
    if (f.required && !v) back(table, `กรุณากรอก “${f.label}”`, true);
    if (v === "") continue; // ปล่อยให้ใช้ค่า default ของฐานข้อมูล
    row[f.name] = f.type === "number" ? Number(v) : v;
  }

  const file = formData.get("file");
  if (cfg.table === "documents" && file instanceof File && file.size > 0) {
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${new Date().getFullYear()}/${Date.now()}-${safe}`;
    const { error } = await sb.storage.from("academic-docs").upload(path, file, { contentType: file.type });
    if (error) back(table, "อัปโหลดไฟล์ไม่สำเร็จ: " + error.message, true);
    row.file_url = sb.storage.from("academic-docs").getPublicUrl(path).data.publicUrl;
  }
  if (cfg.table === "documents" && !row.file_url) back(table, "ต้องใส่ลิงก์ไฟล์หรืออัปโหลดไฟล์อย่างใดอย่างหนึ่ง", true);

  const { error } = await sb.from(cfg.table).insert(row);
  if (error) back(table, "บันทึกไม่สำเร็จ: " + error.message, true);
  revalidatePath("/", "layout");
  back(table, "บันทึกแล้ว");
}

export async function deleteRow(table: string, id: string) {
  const cfg = findTable(table);
  if (!cfg) redirect("/admin");
  const sb = await guard();
  const { error } = await sb.from(cfg.table).delete().eq("id", id);
  if (error) back(table, "ลบไม่สำเร็จ: " + error.message, true);
  revalidatePath("/", "layout");
  back(table, "ลบแล้ว");
}

export async function saveSettings(formData: FormData) {
  const sb = await guard();
  const rows = settingDefs.map((d) => ({
    key: d.key,
    value: String(formData.get(d.key) ?? "").trim(),
    updated_at: new Date().toISOString(),
  }));
  const { error } = await sb.from("settings").upsert(rows);
  if (error) redirect("/admin/settings?err=" + encodeURIComponent(error.message));
  revalidatePath("/", "layout");
  redirect("/admin/settings?msg=" + encodeURIComponent("บันทึกแล้ว"));
}
