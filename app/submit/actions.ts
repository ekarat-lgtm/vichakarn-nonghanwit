"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession, isStaff } from "@/lib/data";
import { dbInsert } from "@/lib/db";
import { driveFolderId, getDriveLinks } from "@/lib/drive";
import { createUploadSession, driveUploadReady, verifyDriveFile } from "@/lib/gdrive";
import { ALLOWED_EXT, fileExt, LEARNING_AREAS, LEVELS, MAX_FILES, MAX_FILE_MB, type SubmittedFile } from "@/lib/submissions";

type Fail = { ok: false; error: string };
const fail = (error: string): Fail => ({ ok: false, error });
const safe = (s: string) => s.replace(/[\\/:*?"<>|\r\n]+/g, " ").replace(/\s+/g, " ").trim();

async function resolveTask(url: string) {
  const link = (await getDriveLinks()).find((l) => l.url === url);
  const folderId = link ? driveFolderId(link.url) : null;
  return link && folderId ? { link, folderId } : null;
}

/** ขั้นที่ 1: ขอลิงก์อัปโหลดชั่วคราวสำหรับไฟล์หนึ่งไฟล์ (ไฟล์เองไม่ผ่านเซิร์ฟเวอร์นี้) */
export async function startUpload(i: { taskUrl: string; subject: string; levels: string; fileName: string; mime: string; size: number }): Promise<{ ok: true; url: string } | Fail> {
  const me = await getSession();
  if (!me.email || !isStaff(me.role)) return fail("กรุณาเข้าสู่ระบบครูก่อน");
  if (!driveUploadReady()) return fail("ยังไม่ได้ตั้งค่าการอัปโหลดอัตโนมัติ");
  if (!(i.size > 0) || i.size > MAX_FILE_MB * 1024 * 1024) return fail(`ไฟล์ต้องมีขนาดไม่เกิน ${MAX_FILE_MB} MB`);
  if (!ALLOWED_EXT.includes(fileExt(i.fileName))) return fail(`ชนิดไฟล์ที่รับ: ${ALLOWED_EXT.join(", ")}`);
  const task = await resolveTask(i.taskUrl);
  if (!task) return fail("ไม่พบโฟลเดอร์งานที่เลือก (แอดมินอาจเปลี่ยนลิงก์แล้ว — รีเฟรชหน้านี้)");
  const name = `${safe(i.levels)}_${safe(i.subject)}_${safe(me.name ?? me.email)}_${safe(i.fileName)}`.slice(0, 200);
  const origin = (await headers()).get("origin") ?? "";
  try {
    return { ok: true, url: await createUploadSession({ name, mime: i.mime, size: i.size, folderId: task.folderId, origin }) };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "สร้างลิงก์อัปโหลดไม่สำเร็จ");
  }
}

export type SubmitPayload = {
  taskUrl: string; area: string; subject: string; levels: string[]; room: string;
  year: string; semester: string; note: string;
  fileIds: string[];                          // โหมดอัปโหลดอัตโนมัติ
  manualName: string; manualUrl: string;      // โหมดแจ้งอย่างเดียว (อัปโหลดเองใน Drive)
};

/** ขั้นที่ 2: บันทึกข้อมูลแจ้งส่ง (เฉพาะข้อความ) — ตรวจกับ Drive ก่อนว่าไฟล์อยู่ในโฟลเดอร์จริง */
export async function recordSubmission(p: SubmitPayload): Promise<{ ok: true } | Fail> {
  const me = await getSession();
  if (!me.email || !me.uid || !isStaff(me.role)) return fail("กรุณาเข้าสู่ระบบครูก่อน");
  const task = await resolveTask(p.taskUrl);
  if (!task) return fail("ไม่พบโฟลเดอร์งานที่เลือก");
  const subject = p.subject.trim();
  if (!LEARNING_AREAS.includes(p.area)) return fail("กรุณาเลือกกลุ่มสาระการเรียนรู้");
  if (!subject) return fail("กรุณากรอกรายวิชา");
  const levels = p.levels.filter((l) => LEVELS.includes(l));
  if (!levels.length) return fail("กรุณาเลือกระดับชั้นอย่างน้อย 1 ระดับ");

  let files: SubmittedFile[] = [];
  if (driveUploadReady()) {
    if (!p.fileIds.length || p.fileIds.length > MAX_FILES) return fail(`กรุณาแนบไฟล์ 1–${MAX_FILES} ไฟล์`);
    for (const id of p.fileIds) {
      const f = await verifyDriveFile(id, task.folderId);
      if (!f) return fail("ตรวจไม่พบไฟล์ในโฟลเดอร์ Drive — ลองอัปโหลดใหม่อีกครั้ง");
      files.push({ id: f.id, name: f.name, size: f.size, url: f.url });
    }
  } else {
    const name = p.manualName.trim();
    if (!name) return fail("กรุณาระบุชื่อไฟล์ที่อัปโหลดไว้ใน Drive");
    const url = p.manualUrl.trim();
    files = [{ name, url: /^https:\/\/(drive|docs)\.google\.com\//.test(url) ? url : null }];
  }

  const room = p.room.trim().slice(0, 40);
  const { error } = await dbInsert("work_submissions", {
    user_id: me.uid, teacher_name: me.name ?? me.email,
    learning_area: p.area, subject: subject.slice(0, 120),
    levels: levels.join(", ") + (room ? ` (ห้อง ${room})` : ""),
    task_label: task.link.label, task_url: task.link.url,
    academic_year: p.year.trim().slice(0, 8) || null, semester: p.semester.trim().slice(0, 4) || null,
    note: p.note.trim().slice(0, 500) || null, files,
  });
  if (error) return fail("บันทึกไม่สำเร็จ: " + error + " (รัน supabase/schema_v5.sql แล้วหรือยัง?)");
  revalidatePath("/submit");
  revalidatePath("/admin/submissions");
  return { ok: true };
}
