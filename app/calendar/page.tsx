import { getEvents, getSettings, fmtDate } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "ปฏิทินงานวิชาการ" };

export default async function CalendarPage() {
  const [events, s] = await Promise.all([getEvents(), getSettings()]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <div className="page-head"><div className="container"><h1>📅 ปฏิทินงานวิชาการ</h1><p>เปิด-ปิดภาคเรียน สอบ ส่งคะแนน นิเทศ และกิจกรรมวิชาการ</p></div></div>
      <div className="container section">
        {s.calendar_embed_url && (
          <div style={{ marginBottom: 28 }}>
            <iframe className="cal-embed" src={s.calendar_embed_url} title="Google Calendar" />
          </div>
        )}
        <div className="table-wrap">
          <table>
            <thead><tr><th>วันที่</th><th>กิจกรรม</th><th>ประเภท</th></tr></thead>
            <tbody>
              {events.length ? events.map((e) => (
                <tr key={e.id} style={e.start_date < today && !(e.end_date && e.end_date >= today) ? { opacity: 0.55 } : undefined}>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtDate(e.start_date)}{e.end_date ? ` – ${fmtDate(e.end_date)}` : ""}</td>
                  <td><b>{e.title}</b>{e.description && <div className="meta">{e.description}</div>}</td>
                  <td><span className="tag">{e.category}</span></td>
                </tr>
              )) : <tr><td colSpan={3} className="meta">ยังไม่มีกำหนดการ — เพิ่มที่ /admin/events</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
