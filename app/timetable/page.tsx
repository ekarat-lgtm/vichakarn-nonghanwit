import { Fragment } from "react";
import Link from "next/link";
import { getTimetable } from "@/lib/data";
import { todayTH } from "@/lib/store";
import { DAYS, PERIOD_TIMES } from "@/lib/timetable";

export const dynamic = "force-dynamic";
export const metadata = { title: "ตารางสอน" };

export default async function Timetable({ searchParams }: { searchParams: Promise<{ class?: string; teacher?: string }> }) {
  const { class: cls, teacher } = await searchParams;
  const all = await getTimetable();
  const classes = [...new Set(all.map((s) => s.class_name))].sort();
  const teachers = [...new Set(all.map((s) => s.teacher_name).filter(Boolean) as string[])].sort();
  const mode = teacher ? "teacher" : "class";
  const picked = mode === "teacher" ? teacher! : cls ?? classes[0];
  const slots = all.filter((s) => (mode === "teacher" ? s.teacher_name === picked : s.class_name === picked));
  const today = new Date(todayTH()).getUTCDay(); // 1=จันทร์
  const maxPeriod = Math.max(8, ...slots.map((s) => s.period));
  const cellOf = (d: number, p: number) => slots.filter((s) => s.day === d && s.period === p);

  return (
    <>
      <div className="page-head"><div className="container"><h1>🗓️ ตารางสอน</h1><p>ดูตารางเรียนตามห้อง หรือตารางสอนตามครูผู้สอน — เปิดดูบนมือถือได้</p></div></div>
      <div className="container section">
        {!all.length ? <div className="empty">ยังไม่มีข้อมูลตารางสอน — ผู้ดูแลเพิ่มได้ที่ “จัดการเว็บ → ตารางสอน”</div> : (
          <>
            <form className="filters" action="/timetable">
              <select name="class" defaultValue={mode === "class" ? picked : ""} aria-label="เลือกห้อง">
                <option value="">— เลือกห้องเรียน —</option>
                {classes.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select name="teacher" defaultValue={mode === "teacher" ? picked : ""} aria-label="เลือกครู">
                <option value="">— หรือเลือกครู —</option>
                {teachers.map((t) => <option key={t}>{t}</option>)}
              </select>
              <button className="btn brand small">แสดงตาราง</button>
              <span className="hint" style={{ alignSelf: "center" }}>ถ้าเลือกทั้งสองช่อง จะแสดงตามครู</span>
            </form>
            <div className="section-title"><h2>{mode === "teacher" ? `ตารางสอน ${picked}` : `ตารางเรียน ${picked}`}</h2>
              <Link href="/calendar">ตารางสอบดูที่ปฏิทิน →</Link></div>
            <div className="table-wrap">
              <table className="tt">
                <thead>
                  <tr><th>คาบ / เวลา</th>{[1, 2, 3, 4, 5].map((d) => <th key={d} className={d === today ? "today" : ""}>{DAYS[d]}</th>)}</tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((p) => (
                    <Fragment key={p}>
                      {p === 5 && <tr key="lunch" className="lunch"><td colSpan={6}>🍚 พักกลางวัน</td></tr>}
                      <tr>
                        <th className="ptime"><b>{p}</b><small>{PERIOD_TIMES[p] ?? ""}</small></th>
                        {[1, 2, 3, 4, 5].map((d) => {
                          const items = cellOf(d, p);
                          return (
                            <td key={d} className={d === today ? "today" : ""}>
                              {items.length ? items.map((s) => (
                                <div className="slot" key={s.id}>
                                  <b>{s.subject}</b>
                                  <small>{mode === "teacher" ? s.class_name : s.teacher_name}{s.room ? ` · ${s.room}` : ""}</small>
                                </div>
                              )) : <span className="free">—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="meta" style={{ marginTop: 12 }}>เวลาคาบเรียนเป็นค่าตัวอย่าง (ปรับได้ที่ lib/timetable.ts)</p>
          </>
        )}
      </div>
    </>
  );
}
