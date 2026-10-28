import Link from "next/link";
import { getSession, getSettings, isStaff } from "@/lib/data";
import { dbSelect } from "@/lib/db";
import { getDriveLinks } from "@/lib/drive";
import { driveUploadReady } from "@/lib/gdrive";
import { fmtDateTime } from "@/lib/requests";
import type { Submission } from "@/lib/submissions";
import SubmitForm from "@/components/SubmitForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "ส่งงานครู" };

export default async function SubmitPage() {
  const { role, name, email, uid } = await getSession();
  const head = (
    <div className="page-head"><div className="container"><h1>📁 ส่งงานครู</h1><p>กรอกแบบแจ้งส่งงาน แล้วแนบไฟล์ — ไฟล์จะถูกเก็บใน Google Drive ของฝ่ายวิชาการ</p></div></div>
  );

  if (!email || !isStaff(role)) {
    return (
      <>
        {head}
        <div className="container section">
          <div className="alert info">หน้านี้สำหรับครู — กรุณาเข้าสู่ระบบก่อน</div>
          <Link href="/login" className="btn brand">เข้าสู่ระบบครู</Link>
        </div>
      </>
    );
  }

  const [links, s] = await Promise.all([getDriveLinks(), getSettings()]);
  let mine: Submission[] = [];
  try {
    mine = (await dbSelect("work_submissions", { eq: { user_id: uid }, order: { col: "created_at", asc: false }, limit: 20 })) as unknown as Submission[];
  } catch { /* ยังไม่ได้รัน schema_v5.sql */ }
  const ready = driveUploadReady();

  return (
    <>
      {head}
      <div className="container section">
        <div className="grid cols-2" style={{ alignItems: "start" }}>
          <div className="card">
            <h2 style={{ marginTop: 6 }}>แบบแจ้งส่งงาน</h2>
            <p className="meta">ผู้ส่ง: {name ?? email}</p>
            {!ready && <div className="alert info">ขณะนี้ยังอัปโหลดผ่านเว็บไม่ได้ — ให้อัปโหลดไฟล์ในโฟลเดอร์ Drive เองก่อน แล้วกรอกแบบแจ้งส่งนี้</div>}
            <SubmitForm tasks={links} uploadReady={ready} year={s.current_year ?? ""} semester={s.current_semester ?? ""} />
            {role === "admin" && <p className="hint">แอดมิน: ตั้งค่าโฟลเดอร์ที่ <Link href="/admin/drive">/admin/drive</Link></p>}
          </div>
          <div className="card">
            <h2 style={{ marginTop: 6 }}>ประวัติการส่งของฉัน</h2>
            {mine.length ? (
              <ul className="cal-list">
                {mine.map((m) => (
                  <li key={m.id} style={{ display: "block", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                    <b>{m.subject}</b> <span className="tag">{m.levels}</span>
                    <div className="meta">{m.task_label} · {fmtDateTime(m.created_at)}</div>
                    <div className="meta">
                      {(m.files ?? []).map((f, i) => (f.url ? <a key={i} href={f.url} target="_blank" rel="noreferrer noopener" style={{ marginRight: 10 }}>📎 {f.name}</a> : <span key={i} style={{ marginRight: 10 }}>📎 {f.name}</span>))}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <div className="empty">ยังไม่มีรายการแจ้งส่ง</div>}
          </div>
        </div>
      </div>
    </>
  );
}
