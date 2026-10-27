"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, isEditor, isStaff } from "@/lib/data";
import { dbDelete, dbInsert, dbSelect } from "@/lib/db";

/** ครู: แจ้งส่งงานของตัวเอง / ยกเลิก (สลับสถานะ) */
export async function toggleMine(taskId: string) {
  const { role, uid, name } = await getSession();
  if (!isStaff(role) || !uid) redirect("/login");
  const [hit] = await dbSelect("submissions", { eq: { task_id: taskId, teacher_id: uid }, limit: 1 });
  if (hit) await dbDelete("submissions", hit.id);
  else await dbInsert("submissions", { task_id: taskId, teacher_id: uid, teacher_name: name });
  revalidatePath("/tracking");
  revalidatePath("/admin/tracking");
  redirect("/tracking");
}

/** ฝ่ายวิชาการ: ติ๊กสถานะแทนครูแต่ละคน */
export async function toggleFor(taskId: string, teacherId: string, teacherName: string) {
  const { role } = await getSession();
  if (!isEditor(role)) redirect("/login");
  const [hit] = await dbSelect("submissions", { eq: { task_id: taskId, teacher_id: teacherId }, limit: 1 });
  if (hit) await dbDelete("submissions", hit.id);
  else await dbInsert("submissions", { task_id: taskId, teacher_id: teacherId, teacher_name: teacherName });
  revalidatePath("/tracking");
  revalidatePath("/admin/tracking");
  redirect("/admin/tracking");
}
