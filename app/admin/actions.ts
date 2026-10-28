"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { findTable, type TableCfg } from "@/lib/adminConfig";
import { settingDefs } from "@/lib/school";
import { getSession, isEditor } from "@/lib/data";
import { dbDelete, dbInsert, dbSelect, dbUpdate, dbUpsert, type Row } from "@/lib/db";
import { uploadFile } from "@/lib/upload";
import { createStaff, resetStaffPassword } from "@/lib/staff";

async function guard(adminOnly = false) {
  const { role } = await getSession();
  if (!isEditor(role) || (adminOnly && role !== "admin")) redirect("/login");
}

const back = (to: string, msg: string, err = false): never =>
  redirect(`${to}${to.includes("?") ? "&" : "?"}${err ? "err" : "msg"}=${encodeURIComponent(msg)}`);

const refresh = () => {
  revalidatePath("/", "layout");
  revalidateTag("content");
};

async function buildRow(cfg: TableCfg, fd: FormData, editing: boolean, to: string): Promise<Row> {
  const row: Row = {};
  for (const f of cfg.fields) {
    if (f.type === "file") {
      const file = fd.get(f.name);
      if (file instanceof File && file.size > 0 && f.uploadTo) {
        const up = await uploadFile(file, cfg.table);
        if (up.error) back(to, "อัปโหลดไฟล์ไม่สำเร็จ: " + up.error, true);
        row[f.uploadTo] = up.url;
      }
      continue;
    }
    const v = String(fd.get(f.name) ?? "").trim();
    if (f.required && !v) back(to, `กรุณากรอก “${f.label}”`, true);
    if (f.type === "bool") { row[f.name] = v !== "false"; continue; }
    if (v === "") {
      if (editing && f.type !== "number" && !f.required) row[f.name] = null; // ล้างค่าที่ผู้ใช้ลบออก
      continue; // สร้างใหม่: ปล่อยให้ใช้ค่า default ของฐานข้อมูล
    }
    row[f.name] = f.type === "number" ? Number(v) : v;
  }
  return row;
}

export async function createRow(table: string, formData: FormData) {
  const cfg = findTable(table);
  if (!cfg) redirect("/admin");
  await guard(cfg.adminOnly);
  const to = `/admin/${table}`;
  const row = await buildRow(cfg, formData, false, to);
  if (cfg.table === "documents" && !row.file_url) back(to, "ต้องใส่ลิงก์ไฟล์หรืออัปโหลดไฟล์อย่างใดอย่างหนึ่ง", true);
  const { error } = await dbInsert(cfg.table, row);
  if (error) back(to, "บันทึกไม่สำเร็จ: " + error, true);
  refresh();
  back(to, "บันทึกแล้ว");
}

export async function updateRow(table: string, id: string, formData: FormData) {
  const cfg = findTable(table);
  if (!cfg) redirect("/admin");
  await guard(cfg.adminOnly);
  const to = `/admin/${table}/${id}`;
  const row = await buildRow(cfg, formData, true, to);
  if (cfg.table === "documents") row.updated_at = new Date().toISOString().slice(0, 10);
  const { error } = await dbUpdate(cfg.table, id, row);
  if (error) back(to, "แก้ไขไม่สำเร็จ: " + error, true);
  refresh();
  back(`/admin/${table}`, "แก้ไขแล้ว");
}

export async function deleteRow(table: string, id: string) {
  const cfg = findTable(table);
  if (!cfg) redirect("/admin");
  await guard(cfg.adminOnly);
  const { error } = await dbDelete(cfg.table, id);
  if (error) back(`/admin/${table}`, "ลบไม่สำเร็จ: " + error, true);
  refresh();
  back(`/admin/${table}`, "ลบแล้ว");
}

export async function togglePublished(table: string, id: string) {
  await guard();
  const [row] = await dbSelect(table, { eq: { id }, limit: 1 });
  if (!row) back(`/admin/${table}`, "ไม่พบรายการ", true);
  const next = !row.published;
  const { error } = await dbUpdate(table, id, { published: next });
  if (error) back(`/admin/${table}`, error, true);
  refresh();
  back(`/admin/${table}`, next ? "เผยแพร่แล้ว" : "ซ่อนเป็นฉบับร่างแล้ว");
}

export async function saveSettings(formData: FormData) {
  await guard();
  const rows = settingDefs.map((d) => ({
    key: d.key,
    value: String(formData.get(d.key) ?? "").trim(),
    updated_at: new Date().toISOString(),
  }));
  const { error } = await dbUpsert("settings", rows, "key");
  if (error) redirect("/admin/settings?err=" + encodeURIComponent(error));
  refresh();
  redirect("/admin/settings?msg=" + encodeURIComponent("บันทึกแล้ว"));
}

/* ---------- ข้อ 4: จัดการผู้ใช้ ---------- */
export async function updateUserRole(id: string, formData: FormData) {
  await guard(true);
  const role = String(formData.get("role") ?? "");
  if (!["guest", "teacher", "editor", "admin"].includes(role)) back("/admin/users", "สิทธิ์ไม่ถูกต้อง", true);
  const me = await getSession();
  if (me.uid === id && role !== "admin") back("/admin/users", "ไม่สามารถลดสิทธิ์ของตัวเองได้", true);
  const { error } = await dbUpdate("profiles", id, { role });
  if (error) back("/admin/users", error, true);
  refresh();
  back("/admin/users", "เปลี่ยนสิทธิ์แล้ว");
}

/* ---------- บัญชีครูด้วยเลขบัตรประชาชน (รหัสเริ่มต้น = วันเกิด) ---------- */
export async function createTeacher(formData: FormData) {
  await guard(true);
  const err = await createStaff({
    nid: String(formData.get("nid") ?? ""),
    name: String(formData.get("name") ?? ""),
    birth: String(formData.get("birth") ?? ""),
    role: String(formData.get("role") ?? "teacher"),
  });
  if (err) back("/admin/users", err, true);
  refresh();
  back("/admin/users", "เพิ่มบัญชีแล้ว — ครูเข้าสู่ระบบด้วยเลขบัตร + วันเกิด และต้องเปลี่ยนรหัสผ่านครั้งแรก");
}

/** นำเข้าหลายคน: 1 บรรทัดต่อ 1 คน  เลขบัตร, ชื่อ-สกุล, วันเกิด[, สิทธิ์]  (คั่นด้วยจุลภาคหรือแท็บ — วางจาก Excel ได้) */
export async function importTeachers(formData: FormData) {
  await guard(true);
  const lines = String(formData.get("rows") ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) back("/admin/users", "ยังไม่ได้วางรายชื่อ", true);
  if (lines.length > 200) back("/admin/users", "นำเข้าได้ครั้งละไม่เกิน 200 รายการ", true);
  let ok = 0;
  const fails: string[] = [];
  for (const [i, line] of lines.entries()) {
    const [nid = "", name = "", birth = "", role = "teacher"] = line.split(/[\t,]/).map((x) => x.trim());
    const err = await createStaff({ nid, name, birth, role: role || "teacher" });
    if (err) fails.push(`บรรทัด ${i + 1}: ${err}`); else ok++;
  }
  refresh();
  const msg = `นำเข้าสำเร็จ ${ok} รายการ` + (fails.length ? ` · ไม่สำเร็จ ${fails.length}: ` + fails.slice(0, 8).join(" | ") + (fails.length > 8 ? " …" : "") : "");
  back("/admin/users", msg, fails.length > 0 && ok === 0);
}

export async function resetStaffPasswordAction(id: string, formData: FormData) {
  await guard(true);
  const err = await resetStaffPassword(id, String(formData.get("birth") ?? ""));
  if (err) back("/admin/users", err, true);
  back("/admin/users", "รีเซ็ตรหัสผ่านเป็นวันเกิดแล้ว — ครูต้องเปลี่ยนรหัสใหม่เมื่อเข้าสู่ระบบ");
}

/* ---------- ข้อ 5: ตอบคำร้อง ---------- */
export async function updateRequest(id: string, formData: FormData) {
  await guard();
  const status = String(formData.get("status") ?? "รอดำเนินการ");
  const response = String(formData.get("response") ?? "").trim();
  const { error } = await dbUpdate("requests", id, { status, response: response || null, updated_at: new Date().toISOString() });
  if (error) back("/admin/requests", error, true);
  back("/admin/requests", "บันทึกการตอบกลับแล้ว");
}
