import { getSession } from "@/lib/data";
import { DRIVE_MAX_LINKS, getDriveLinks } from "@/lib/drive";
import { saveDriveLinks } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminDrivePage({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  const { msg, err } = await searchParams;
  const { role } = await getSession();
  if (role !== "admin") return <div className="alert err">หน้านี้สำหรับแอดมินเท่านั้น</div>;
  const links = await getDriveLinks();
  const rows = Array.from({ length: DRIVE_MAX_LINKS }, (_, i) => links[i] ?? { label: "", url: "", note: "" });

  return (
    <>
      {msg && <div className="alert ok">{msg}</div>}
      {err && <div className="alert err">{err}</div>}
      <div className="card" style={{ padding: 18 }}>
        <h2 style={{ marginTop: 0 }}>📁 โฟลเดอร์ Google Drive สำหรับให้ครูส่งงาน</h2>
        <p className="hint">
          ครูกดปุ่มที่หน้า <b>/submit</b> แล้วลากไฟล์ลงโฟลเดอร์ใน Google Drive ได้เลย — ไฟล์ไม่ผ่านฐานข้อมูลของเว็บ ·
          เปลี่ยนลิงก์ได้ทุกเมื่อ (เช่น เปลี่ยนโฟลเดอร์ทุกภาคเรียน) · ช่องที่เว้นว่างจะไม่แสดง
        </p>
        <form action={saveDriveLinks} className="stack">
          {rows.map((r, i) => (
            <fieldset key={i} style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 12, display: "grid", gap: 8 }}>
              <legend style={{ padding: "0 8px", fontWeight: 600 }}>โฟลเดอร์ที่ {i + 1}</legend>
              <label>ชื่อที่แสดง<input name={`label_${i}`} defaultValue={r.label} maxLength={80} placeholder="เช่น แผนการจัดการเรียนรู้ ภาคเรียนที่ 2/2569" /></label>
              <label>ลิงก์ Google Drive<input name={`url_${i}`} defaultValue={r.url} type="url" placeholder="https://drive.google.com/drive/folders/…" /></label>
              <label>คำอธิบายสั้น ๆ (ไม่บังคับ)<input name={`note_${i}`} defaultValue={r.note} maxLength={160} placeholder="เช่น ตั้งชื่อไฟล์: ชื่อวิชา_ชื่อ-สกุล · ส่งภายในวันที่ 2 พ.ย." /></label>
            </fieldset>
          ))}
          <button className="btn brand">บันทึกลิงก์</button>
        </form>
        <details style={{ marginTop: 16 }}>
          <summary><b>วิธีตั้งค่าโฟลเดอร์ใน Google Drive</b></summary>
          <ol className="hint" style={{ lineHeight: 1.9 }}>
            <li>สร้างโฟลเดอร์ใน Google Drive ของฝ่ายวิชาการ → คลิกขวา → <b>แชร์</b></li>
            <li>ตั้ง “การเข้าถึงทั่วไป” เป็น <b>จำกัด</b> แล้วเพิ่มโดเมน/กลุ่ม <b>@nonghanwit.ac.th</b> เป็น <b>ผู้แก้ไข</b> (หรือเพิ่มอีเมลครูทีละคน) — ครูจะอัปโหลดได้เมื่อล็อกอิน Google ด้วยอีเมลนั้น</li>
            <li>คัดลอกลิงก์โฟลเดอร์มาวางในช่องด้านบน</li>
            <li>อยากให้ครูแนบไฟล์โดยไม่ต้องมีบัญชี Google ที่ได้รับสิทธิ์ ให้สร้าง <b>Google Forms</b> ที่มีคำถามประเภท “อัปโหลดไฟล์” แล้ววางลิงก์ฟอร์ม (forms.gle) แทน</li>
          </ol>
          <p className="hint">⚠️ ลิงก์ที่บันทึกไว้อ่านได้จากฝั่งเว็บสาธารณะ (ตาราง settings) — ความปลอดภัยของไฟล์จึงขึ้นกับการตั้งสิทธิ์แชร์ใน Drive ไม่ใช่การซ่อนลิงก์</p>
        </details>
      </div>
    </>
  );
}
