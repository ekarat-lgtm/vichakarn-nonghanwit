import { fmtDate } from "@/lib/data";
import { REQUEST_STATUSES, REQUEST_TYPES, trackRequest } from "@/lib/requests";
import { LEVELS } from "@/lib/submissions";
import { submitRequest } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "คำร้องออนไลน์" };

export default async function Requests({ searchParams }: { searchParams: Promise<{ code?: string; done?: string; err?: string; type?: string }> }) {
  const { code, done, err, type } = await searchParams;
  const tracked = code ? await trackRequest(code) : null;
  const stIdx = tracked ? REQUEST_STATUSES.indexOf(tracked.status) : -1;
  return (
    <>
      <div className="page-head"><div className="container"><h1>📨 คำร้องออนไลน์</h1><p>ยื่นคำร้องงานวิชาการ/ทะเบียน และติดตามสถานะด้วยรหัสคำร้อง</p></div></div>
      <div className="container section">
        {done && (
          <div className="alert ok">
            ส่งคำร้องเรียบร้อยแล้ว — <b>รหัสคำร้องของคุณ: {done}</b> (โปรดจดไว้เพื่อติดตามสถานะ)
          </div>
        )}
        {err && <div className="alert err">{err}</div>}
        <div className="grid cols-2" style={{ alignItems: "start" }}>
          <div className="card" id="form">
            <h2>ยื่นคำร้องใหม่</h2>
            <form action={submitRequest} className="stack">
              <label>ประเภทคำร้อง *
                <select name="type" required defaultValue={type && REQUEST_TYPES.includes(type) ? type : undefined}>{REQUEST_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              </label>
              <label>ชื่อ-สกุล ผู้ยื่นคำร้อง *<input name="requester_name" required maxLength={120} /></label>
              <label>ระดับชั้น
                <select name="level" defaultValue=""><option value="">— ไม่ระบุ —</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
              </label>
              <label>ชั้น/ห้อง (ถ้ามี)<input name="class_name" placeholder="เช่น ม.6/2" maxLength={40} /></label>
              <label>เบอร์โทร / LINE ID สำหรับติดต่อกลับ *<input name="contact" required maxLength={80} /></label>
              <label>รายละเอียด<textarea name="detail" maxLength={1500} placeholder="ระบุรายวิชา/เอกสารที่ต้องการ และเหตุผล" /></label>
              <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hp" />
              <button className="btn brand">ส่งคำร้อง</button>
              <p className="hint">ข้อมูลของคุณใช้เพื่อดำเนินการคำร้องเท่านั้น</p>
            </form>
          </div>

          <div className="card" id="track">
            <h2>🔍 ติดตามสถานะ</h2>
            <form className="filters" style={{ padding: 0, border: 0, boxShadow: "none", background: "transparent" }}>
              <input name="code" defaultValue={code ?? ""} placeholder="รหัสคำร้อง เช่น RQ-69-XXXXXX" style={{ flex: 1, minWidth: 200 }} />
              <button className="btn brand small">ตรวจสอบ</button>
            </form>
            {code && !tracked && <div className="alert err">ไม่พบรหัสคำร้อง “{code}” — ตรวจสอบตัวสะกดอีกครั้ง</div>}
            {tracked && (
              <div className="track">
                <p><b>{tracked.code}</b><br /><span className="meta">{tracked.type} · ยื่นเมื่อ {fmtDate(tracked.created_at)}</span></p>
                <ol className="steps">
                  {REQUEST_STATUSES.slice(0, 3).map((s, i) => (
                    <li key={s} className={i <= stIdx && stIdx < 3 ? "on" : ""}>{s}</li>
                  ))}
                </ol>
                {tracked.status === "ไม่อนุมัติ" && <div className="alert err">สถานะ: ไม่อนุมัติ</div>}
                {tracked.response && <div className="alert info"><b>ข้อความจากฝ่ายวิชาการ:</b> {tracked.response}</div>}
              </div>
            )}
            {!code && <p className="meta">ใส่รหัสที่ได้รับตอนยื่นคำร้อง เพื่อดูความคืบหน้า{" "}
              <span className="hint">(เดโม: ลอง RQ-69-DEMO01)</span></p>}
          </div>
        </div>
      </div>
    </>
  );
}
