import { createClient, hasSupabase } from "@/lib/supabase/server";

/** อัปโหลดไฟล์: Supabase Storage เมื่อตั้งค่าแล้ว ไม่งั้นเก็บเป็น data URL (เดโม, ≤ 1.5MB) */
export async function uploadFile(file: File, folder = "files"): Promise<{ url?: string; error?: string }> {
  if (!hasSupabase) {
    if (file.size > 1.5 * 1024 * 1024) return { error: "โหมดเดโมรองรับไฟล์ไม่เกิน 1.5MB" };
    const buf = Buffer.from(await file.arrayBuffer());
    return { url: `data:${file.type || "application/octet-stream"};base64,${buf.toString("base64")}` };
  }
  const sb = await createClient();
  if (!sb) return { error: "ยังไม่ได้ตั้งค่า Supabase" };
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${folder}/${new Date().getFullYear()}/${Date.now()}-${safe}`;
  const { error } = await sb.storage.from("academic-docs").upload(path, file, { contentType: file.type });
  if (error) return { error: error.message };
  return { url: sb.storage.from("academic-docs").getPublicUrl(path).data.publicUrl };
}
