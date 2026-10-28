/* เชื่อม Google Drive ด้วย Service Account (ฝั่งเซิร์ฟเวอร์เท่านั้น) — ไม่ต้องใช้แพ็กเกจเพิ่ม
   ไฟล์ไม่ผ่านเซิร์ฟเวอร์ของเรา: เซิร์ฟเวอร์ขอ "ลิงก์อัปโหลดชั่วคราว" แล้วเบราว์เซอร์ของครูส่งไฟล์เข้า Google โดยตรง */
import { createSign } from "crypto";

export const driveUploadReady = () => !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

const b64 = (o: object | Buffer) => Buffer.from(o instanceof Buffer ? o : JSON.stringify(o)).toString("base64url");
let cache: { token: string; exp: number } | null = null;

async function accessToken(): Promise<string> {
  if (cache && cache.exp > Date.now() + 60_000) return cache.token;
  const iss = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!.replace(/\\n/g, "\n");
  const iat = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss, scope: "https://www.googleapis.com/auth/drive", aud: "https://oauth2.googleapis.com/token", iat, exp: iat + 3600 })}`;
  const sig = createSign("RSA-SHA256").update(unsigned).sign(key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${b64(sig)}` }),
  });
  const j = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!j.access_token) throw new Error(j.error_description ?? "ขอสิทธิ์ Google ไม่สำเร็จ");
  cache = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return cache.token;
}

/** สร้างเซสชันอัปโหลดแบบ resumable ในโฟลเดอร์ที่กำหนด → คืนลิงก์ที่เบราว์เซอร์ PUT ไฟล์เข้าไปได้โดยตรง */
export async function createUploadSession(o: { name: string; mime: string; size: number; folderId: string; origin: string }): Promise<string> {
  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,size,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await accessToken()}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": o.mime || "application/octet-stream",
        "X-Upload-Content-Length": String(o.size),
        Origin: o.origin, // ให้เซสชันรองรับ CORS จากเว็บของเรา
      },
      body: JSON.stringify({ name: o.name, parents: [o.folderId] }),
    },
  );
  const loc = res.headers.get("location");
  if (!res.ok || !loc) {
    const t = await res.text().catch(() => "");
    throw new Error(res.status === 404 ? "ไม่พบโฟลเดอร์ หรือยังไม่ได้แชร์โฟลเดอร์ให้บัญชีบริการ (Service Account)" : `Google Drive ปฏิเสธ (${res.status}) ${t.slice(0, 120)}`);
  }
  return loc;
}

/** ยืนยันว่าไฟล์อยู่ในโฟลเดอร์นั้นจริง (กันการแจ้งส่งปลอม) */
export async function verifyDriveFile(id: string, folderId: string): Promise<{ id: string; name: string; size?: number; url: string } | null> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?supportsAllDrives=true&fields=id,name,size,webViewLink,parents,trashed`,
    { headers: { Authorization: `Bearer ${await accessToken()}` } },
  );
  if (!res.ok) return null;
  const f = (await res.json()) as { id: string; name: string; size?: string; webViewLink?: string; parents?: string[]; trashed?: boolean };
  if (f.trashed || !f.parents?.includes(folderId)) return null;
  return { id: f.id, name: f.name, size: f.size ? Number(f.size) : undefined, url: f.webViewLink ?? `https://drive.google.com/file/d/${f.id}/view` };
}
