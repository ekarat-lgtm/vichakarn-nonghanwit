import Link from "next/link";
import { getSession, isEditor, isStaff, fmtDate } from "@/lib/data";
import { dueLabel, dueState, loadTracking } from "@/lib/tracking";
import { toggleMine } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "ติดตามการส่งงาน" };

export default async function Tracking() {
  const { role, uid, name } = await getSession();
  if (!isStaff(role)) {
    return (
      <div className="container section">
        <div className="alert info">หน้านี้สำหรับครูและบุคลากร — <Link href="/login">เข้าสู่ระบบ</Link></div>
      </div>
    );
  }
  const { tasks, teachers, has } = await loadTracking();
  const mine = tasks.map((t) => ({ t, sub: uid ? has(t.id, uid) : undefined }));
  const done = mine.filter((m) => m.sub).length;
  return (
    <>
      <div className="page-head"><div className="container"><h1>✅ ติดตามการส่งงานของครู</h1><p>งานและเอกสารที่ต้องส่งฝ่ายวิชาการ — กดแจ้ง “ส่งแล้ว” เมื่อส่งงานเรียบร้อย</p></div></div>
      <div className="container section">
        <div className="card" style={{ marginBottom: 22 }}>
          <b>{name}</b> — ส่งแล้ว {done} จาก {tasks.length} รายการ
          <div className="progress" aria-hidden><span style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} /></div>
          {isEditor(role) && <p style={{ margin: "10px 0 0" }}>👉 <Link href="/admin/tracking">ดูภาพรวมทุกคน / สร้างข้อความแจ้งเตือน</Link> ({teachers.length} คน)</p>}
        </div>
        {mine.length ? (
          <div className="grid cols-2">
            {mine.map(({ t, sub }) => {
              const st = dueState(t.due_date);
              return (
                <div className={`card task ${sub ? "is-done" : `is-${st}`}`} key={t.id}>
                  <div className="task-top">
                    <span className="tag">{t.category}</span>
                    {sub ? <span className="status st-2">ส่งแล้ว ✓</span>
                      : <span className={`status ${st === "overdue" ? "st-3" : st === "soon" ? "st-1" : "st-0"}`}>{dueLabel(t.due_date)}</span>}
                  </div>
                  <h3>{t.title}</h3>
                  <p className="meta">กำหนดส่ง {fmtDate(t.due_date)}{t.description ? ` · ${t.description}` : ""}</p>
                  <form action={toggleMine.bind(null, t.id)}>
                    <button className={`btn small ${sub ? "secondary-dark" : ""}`}>{sub ? "ยกเลิกการแจ้งส่ง" : "แจ้งว่าส่งแล้ว"}</button>
                  </form>
                </div>
              );
            })}
          </div>
        ) : <div className="empty">ยังไม่มีงานที่ต้องส่ง</div>}
      </div>
    </>
  );
}
