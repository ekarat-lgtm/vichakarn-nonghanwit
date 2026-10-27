import { fmtDate } from "@/lib/data";
import { dueLabel, dueState, loadTracking } from "@/lib/tracking";
import { toggleFor } from "@/app/tracking/actions";
import Link from "next/link";

export default async function AdminTracking() {
  const { tasks, teachers, has } = await loadTracking();

  // ข้อความแจ้งเตือน (คัดลอกไปวางในกลุ่ม LINE ได้)
  const lines = tasks
    .filter((t) => dueState(t.due_date) !== "ok")
    .map((t) => {
      const missing = teachers.filter((p) => !has(t.id, p.id)).map((p) => p.full_name);
      if (!missing.length) return "";
      return `📌 ${t.title}\nกำหนดส่ง ${fmtDate(t.due_date)} (${dueLabel(t.due_date)})\nยังไม่ส่ง ${missing.length} ท่าน: ${missing.join(", ")}`;
    })
    .filter(Boolean);
  const reminder = lines.length ? `แจ้งเตือนจากฝ่ายวิชาการ\n\n${lines.join("\n\n")}\n\nกรุณาส่งงานตามกำหนด ขอบคุณครับ/ค่ะ` : "ไม่มีงานที่ใกล้หรือเลยกำหนด หรือทุกคนส่งครบแล้ว 🎉";

  return (
    <>
      <p className="meta">ติ๊กช่องเพื่อสลับสถานะแทนครูแต่ละคนได้ · เพิ่ม/แก้งานที่ต้องส่งที่แท็บ “✅ งานที่ครูต้องส่ง”</p>
      {tasks.length ? (
        <div className="table-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th>ครู/บุคลากร</th>
                {tasks.map((t) => (
                  <th key={t.id} title={t.title}>
                    <div>{t.title.length > 22 ? t.title.slice(0, 22) + "…" : t.title}</div>
                    <small className={`due ${dueState(t.due_date)}`}>{fmtDate(t.due_date)} · {dueLabel(t.due_date)}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teachers.map((p) => (
                <tr key={p.id}>
                  <td>{p.full_name}</td>
                  {tasks.map((t) => {
                    const ok = !!has(t.id, p.id);
                    const st = dueState(t.due_date);
                    return (
                      <td key={t.id} className="mcell">
                        <form action={toggleFor.bind(null, t.id, p.id, p.full_name)}>
                          <button className={`mbtn ${ok ? "ok" : st === "overdue" ? "late" : "wait"}`} aria-label={ok ? "ส่งแล้ว" : "ยังไม่ส่ง"}>
                            {ok ? "✓" : st === "overdue" ? "!" : "•"}
                          </button>
                        </form>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="sumrow">
                <td>ส่งแล้ว (คน)</td>
                {tasks.map((t) => {
                  const n = teachers.filter((p) => has(t.id, p.id)).length;
                  return (
                    <td key={t.id}>
                      <b>{n}/{teachers.length}</b>
                      <div className="progress"><span style={{ width: `${teachers.length ? (n / teachers.length) * 100 : 0}%` }} /></div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      ) : <div className="empty">ยังไม่มีงานที่ต้องส่ง — <Link href="/admin/tasks">เพิ่มงาน</Link></div>}

      <div className="card" style={{ marginTop: 22 }}>
        <h3>📣 ข้อความแจ้งเตือน (คัดลอกไปวางใน LINE กลุ่มครู)</h3>
        <textarea readOnly rows={Math.min(14, reminder.split("\n").length + 1)} style={{ width: "100%" }} defaultValue={reminder} />
      </div>
    </>
  );
}
