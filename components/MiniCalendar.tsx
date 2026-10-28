"use client";
/* ปฏิทินย่อสำหรับหน้าแรก (แทนรายการ "กำหนดการ") — กดวันที่มีกิจกรรมเพื่อดูรายการของวันนั้น */
import { useMemo, useState } from "react";
import Link from "next/link";
import type { CalEvent } from "@/components/MonthCalendar";

const MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const DOW = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const shortDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "UTC" });
};

const PALETTE: [string, string][] = [["#dbe8fb", "#173c80"], ["#fde0ec", "#8c1f4e"], ["#dff3e6", "#1b6b3d"], ["#ece3fa", "#5b2ea6"], ["#ffecd2", "#9a5a00"], ["#d9f1f1", "#0f6b6b"], ["#e7ebf2", "#3d4a63"]];
const FIXED: Record<string, number> = { "กิจกรรมวิชาการ": 0, "วัดผล": 1, "ครู": 2, "นิเทศ": 3, "ลงทะเบียน": 4, "การรับสมัครนักเรียน": 5, "ภาคเรียน": 6 };
const dotColor = (cat: string) => PALETTE[FIXED[cat] ?? [...cat].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length][1];

export default function MiniCalendar({ events, today }: { events: CalEvent[]; today: string }) {
  const [ty, tm] = today.split("-").map(Number);
  const [view, setView] = useState({ y: ty, m: tm - 1 });
  const [day, setDay] = useState<string | null>(null);

  const evs = useMemo(() => events.filter((e) => e.start_date).map((e) => {
    const s = e.start_date.slice(0, 10);
    const en = (e.end_date ?? s).slice(0, 10);
    return { ...e, s, en: en < s ? s : en };
  }), [events]);

  const cells = useMemo(() => {
    const dow = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
    const dim = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
    return [...Array<null>(dow).fill(null), ...Array.from({ length: dim }, (_, i) => ymd(view.y, view.m, i + 1))];
  }, [view]);

  const onDay = (d: string) => evs.filter((e) => e.s <= d && e.en >= d);
  const monthStart = ymd(view.y, view.m, 1);
  const monthEnd = ymd(view.y, view.m, new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate());
  const list = day
    ? onDay(day)
    : evs.filter((e) => e.s <= monthEnd && e.en >= monthStart).sort((a, b) => (a.s > b.s ? 1 : -1)).slice(0, 5);
  const go = (d: number) => { setDay(null); setView(({ y, m }) => { const n = m + d; return { y: y + Math.floor(n / 12), m: ((n % 12) + 12) % 12 }; }); };

  return (
    <div className="mini-cal">
      <div className="mini-cal-nav">
        <button type="button" onClick={() => go(-1)} aria-label="เดือนก่อนหน้า">‹</button>
        <b>{MONTHS[view.m]} {view.y + 543}</b>
        <button type="button" onClick={() => go(1)} aria-label="เดือนถัดไป">›</button>
      </div>
      <div className="mini-cal-grid" role="grid">
        {DOW.map((d, i) => <div key={d} className={`mini-dow${i === 0 || i === 6 ? " we" : ""}`}>{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={`b${i}`} />;
          const es = onDay(d);
          const cats = [...new Set(es.map((e) => e.category))].slice(0, 3);
          return (
            <button key={d} type="button" disabled={!es.length}
              className={`mini-day${d === today ? " today" : ""}${d === day ? " sel" : ""}${es.length ? " has" : ""}`}
              onClick={() => setDay(d === day ? null : d)}
              aria-label={es.length ? `${Number(d.slice(8))} — ${es.length} กิจกรรม` : undefined}>
              {Number(d.slice(8))}
              {cats.length > 0 && <span className="mini-dots">{cats.map((c) => <i key={c} style={{ background: dotColor(c) }} />)}</span>}
            </button>
          );
        })}
      </div>
      <div className="mini-cal-list">
        <div className="mini-cal-sub">{day ? `กิจกรรมวันที่ ${shortDate(day)}` : "กิจกรรมในเดือนนี้"}</div>
        {list.length ? (
          <ul>
            {list.map((e) => (
              <li key={e.id}>
                <span className="mini-date">{shortDate(e.s)}{e.en !== e.s ? ` – ${shortDate(e.en)}` : ""}</span>
                <b>{e.title}</b>
              </li>
            ))}
          </ul>
        ) : <p className="meta" style={{ margin: 0 }}>ไม่มีกิจกรรมในเดือนนี้</p>}
        <Link href="/calendar" className="mini-more">ดูปฏิทินเต็ม →</Link>
      </div>
    </div>
  );
}
