"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/data";
import { dbUpsert } from "@/lib/db";
import { cleanDriveUrl, DRIVE_MAX_LINKS, DRIVE_SETTING_KEY, serializeDriveLinks, type DriveLink } from "@/lib/drive";

const to = (kind: "msg" | "err", text: string): never => redirect(`/admin/drive?${kind}=${encodeURIComponent(text)}`);

/** บันทึกลิงก์โฟลเดอร์ส่งงาน — เฉพาะแอดมิน */
export async function saveDriveLinks(formData: FormData) {
  const { role } = await getSession();
  if (role !== "admin") redirect("/login");

  const links: DriveLink[] = [];
  for (let i = 0; i < DRIVE_MAX_LINKS; i++) {
    const label = String(formData.get(`label_${i}`) ?? "").trim();
    const raw = String(formData.get(`url_${i}`) ?? "").trim();
    const note = String(formData.get(`note_${i}`) ?? "").trim();
    if (!label && !raw) continue; // แถวว่าง = ข้าม
    if (!label) to("err", `แถวที่ ${i + 1}: กรุณาใส่ชื่อโฟลเดอร์`);
    const url = cleanDriveUrl(raw);
    if (!url) to("err", `แถวที่ ${i + 1}: ลิงก์ต้องเป็น https ของ drive.google.com / docs.google.com / forms.gle`);
    links.push({ label, url: url!, note });
  }

  const { error } = await dbUpsert(
    "settings",
    [{ key: DRIVE_SETTING_KEY, value: serializeDriveLinks(links), updated_at: new Date().toISOString() }],
    "key",
  );
  if (error) to("err", "บันทึกไม่สำเร็จ: " + error);
  revalidatePath("/", "layout");
  revalidateTag("content");
  to("msg", links.length ? `บันทึกแล้ว (${links.length} โฟลเดอร์)` : "บันทึกแล้ว — ตอนนี้ยังไม่มีโฟลเดอร์ส่งงาน");
}
