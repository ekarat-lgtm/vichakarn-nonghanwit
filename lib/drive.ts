/* ลิงก์โฟลเดอร์ Google Drive สำหรับให้ครูส่งงาน — แอดมินแก้ไขได้ที่ /admin/drive
   เก็บในตาราง settings คีย์ drive_submit_links รูปแบบ 1 บรรทัดต่อ 1 โฟลเดอร์:  ชื่อ | ลิงก์ | คำอธิบาย(ไม่บังคับ) */
import { getSettings } from "@/lib/data";

export const DRIVE_SETTING_KEY = "drive_submit_links";
export const DRIVE_MAX_LINKS = 8;

export type DriveLink = { label: string; url: string; note: string };

/** อนุญาตเฉพาะโฮสต์ของ Google (Drive / Docs / ฟอร์ม) และต้องเป็น https */
const ALLOWED_HOSTS = ["drive.google.com", "docs.google.com", "forms.gle", "forms.google.com"];

export function cleanDriveUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:") return null;
    return ALLOWED_HOSTS.includes(u.hostname) ? u.toString() : null;
  } catch {
    return null;
  }
}

const strip = (s: string) => s.replace(/[|\r\n]+/g, " ").trim();

export function serializeDriveLinks(links: DriveLink[]): string {
  return links.map((l) => [strip(l.label), l.url.trim(), strip(l.note)].join(" | ")).join("\n");
}

export function parseDriveLinks(raw: string | undefined | null): DriveLink[] {
  return (raw ?? "")
    .split(/\r?\n/)
    .map((line) => line.split("|").map((x) => x.trim()))
    .map(([label = "", url = "", note = ""]) => ({ label, url: cleanDriveUrl(url) ?? "", note }))
    .filter((l) => l.label && l.url)
    .slice(0, DRIVE_MAX_LINKS);
}

export async function getDriveLinks(): Promise<DriveLink[]> {
  const s = await getSettings();
  return parseDriveLinks(s[DRIVE_SETTING_KEY]);
}

/** ดึงรหัสโฟลเดอร์จากลิงก์ Drive (…/folders/ID หรือ …?id=ID) */
export function driveFolderId(url: string): string | null {
  const m = url.match(/\/folders\/([\w-]+)/) ?? url.match(/[?&]id=([\w-]+)/);
  return m ? m[1] : null;
}
