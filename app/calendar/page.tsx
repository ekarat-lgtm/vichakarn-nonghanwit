import { getEvents, getSettings } from "@/lib/data";
import { todayTH } from "@/lib/store";
import MonthCalendar from "@/components/MonthCalendar";

export const dynamic = "force-dynamic";
export const metadata = { title: "ปฏิทินงานวิชาการ" };

export default async function CalendarPage() {
  const [events, s] = await Promise.all([getEvents(false, 500), getSettings()]);
  return (
    <>
      <div className="page-head"><div className="container"><h1>📅 ปฏิทินงานวิชาการ</h1><p>เปิด-ปิดภาคเรียน สอบ ส่งคะแนน นิเทศ และกิจกรรมวิชาการ — คลิกที่แถบกิจกรรมเพื่อดูรายละเอียด</p></div></div>
      <div className="container section">
        <MonthCalendar
          today={todayTH()}
          events={events.map((e) => ({ id: e.id, title: e.title, category: e.category, start_date: e.start_date, end_date: e.end_date, description: e.description }))}
        />
        {s.calendar_embed_url && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 10 }}>Google Calendar</h3>
            <iframe className="cal-embed" src={s.calendar_embed_url} title="Google Calendar" />
          </div>
        )}
      </div>
    </>
  );
}
