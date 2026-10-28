"use client";
/* ปฏิทินรายเดือน: กิจกรรมแสดงเป็นแถบ (คร่อมหลายวันได้) คลิกดูรายละเอียดได้ */
import { useEffect, useMemo, useState } from "react";

export type CalEvent = { id: string; title: string; category: string; start_date: string; end_date: string | null; description: string | null };
type Ev = CalEvent & { s: string; en: string };

const MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const DOW = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const MAX_LANES = 3;

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const addDays = (s: string, n: number) => new Date(parse(s) + n * 864e5).toISOString().slice(0, 10);
const diff = (a: string, b: string) => Math.round((parse(b) - parse(a)) / 864e5);
const longDate = (s: string) => new Date(parse(s)).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDate = (s: string) => new Date(parse(s)).toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "UTC" });

const PALETTE: [string, string][] = [["#dbe8fb", "#173c80"], ["#fde0ec", "#8c1f4e"], ["#dff3e6", "#1b6b3d"], ["#ece3fa", "#5b2ea6"], ["#ffecd2", "#9a5a00"], ["#d9f1f1", "#0f6b6b"], ["#e7ebf2", "#3d4a63"]];
const FIXED: Record<string, number> = { "กิจกรรมวิชาการ": 0, "วัดผล": 1, "ครู": 2, "นิเทศ": 3, "ลงทะเบียน": 4, "การรับสมัครนักเรียน": 5, "ภาคเรียน": 6 };
const colorOf = (cat: string) => PALETTE[FIXED[cat] ?? [...cat].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

export default function MonthCalendar({ events, today }: { events: CalEvent[]; today: string }) {
  const [ty, tm] = today.split("-").map(Number);
  const [view, setView] = useState({ y: ty, m: tm - 1 });
  const [sel, setSel] = useState<Ev | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const close = () => { setSel(null); setDay(null); };

  useEffect(() => {
    if (!sel && !day) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, day]);

  const evs = useMemo<Ev[]>(() => events.filter((e) => e.start_date).map((e) => {
    const s = e.start_date.slice(0, 10);
    let en = (e.end_date ?? s).slice(0, 10);
    if (en < s) en = s;
    return { ...e, s, en };
  }), [events]);

  const weeks = useMemo(() => {
    const first = ymd(view.y, view.m, 1);
    const dow = new Date(parse(first)).getUTCDay();
    const dim = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
    const start = addDays(first, -dow);
    return Array.from({ length: Math.ceil((dow + dim) / 7) }, (_, w) => {
      const ws = addDays(start, w * 7);
      const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
      const we = days[6];
      const segs = evs.filter((e) => e.s <= we && e.en >= ws).map((e) => ({
        e, a: e.s < ws ? 0 : diff(ws, e.s), b: e.en > we ? 6 : diff(ws, e.en), left: e.s < ws, right: e.en > we, lane: 0,
      })).sort((x, y) => x.a - y.a || (y.b - y.a) - (x.b - x.a) || x.e.title.localeCompare(y.e.title));
      const laneEnd: number[] = [];
      for (const sg of segs) {
        let l = laneEnd.findIndex((end) => end < sg.a);
        if (l < 0) l = laneEnd.length;
        laneEnd[l] = sg.b;
        sg.lane = l;
      }
      return { days, segs, lanes: laneEnd.length };
    });
  }, [evs, view]);

  const monthStart = ymd(view.y, view.m, 1);
  const monthEnd = ymd(view.y, view.m, new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate());
  const monthEvents = evs.filter((e) => e.s <= monthEnd && e.en >= monthStart).sort((a, b) => (a.s > b.s ? 1 : a.s < b.s ? -1 : 0));
  const cats = [...new Set(evs.map((e) => e.category))];
  const go = (d: number) => setView(({ y, m }) => { const n = m + d; return { y: y + Math.floor(n / 12), m: ((n % 12) + 12) % 12 }; });
  const dayEvents = day ? evs.filter((e) => e.s <= day && e.en >= day) : [];

  return (
    <div className="cal">
      <div className="cal-toolbar">
        <div className="cal-nav">
          <button type="button" onClick={() => go(-1)} aria-label="เดือนก่อนหน้า">‹</button>
          <h2>{MONTHS[view.m]} {view.y + 543}</h2>
          <button type="button" onClick={() => go(1)} aria-label="เดือนถัดไป">›</button>
        </div>
        <button type="button" className="btn small brand" onClick={() => setView({ y: ty, m: tm - 1 })}>วันนี้</button>
      </div>

      <div className="cal-grid">
        <div className="cal-dow">{DOW.map((d, i) => <div key={d} className={i === 0 || i === 6 ? "we" : ""}>{d}</div>)}</div>
        {weeks.map((w, wi) => {
          const shown = Math.min(w.lanes, MAX_LANES);
          const hiddenAt = (i: number) => w.segs.filter((s) => s.lane >= MAX_LANES && s.a <= i && s.b >= i).length;
          const anyHidden = w.days.some((_, i) => hiddenAt(i) > 0);
          return (
            <div className="cal-week" key={wi} style={{ minHeight: Math.max(96, 34 + shown * 24 + (anyHidden ? 22 : 0) + 8) }}>
              <div className="cal-days">
                {w.days.map((d) => {
                  const inMonth = Number(d.slice(5, 7)) - 1 === view.m;
                  const has = evs.some((e) => e.s <= d && e.en >= d);
                  const dw = new Date(parse(d)).getUTCDay();
                  return (
                    <div key={d} className={`cal-day${inMonth ? "" : " out"}${d === today ? " today" : ""}${dw === 0 || dw === 6 ? " we" : ""}${has ? " has" : ""}`} onClick={has ? () => setDay(d) : undefined}>
                      <span className="cal-num">{Number(d.slice(8))}</span>
                    </div>
                  );
                })}
              </div>
              <div className="cal-bars">
                {w.segs.filter((s) => s.lane < MAX_LANES).map((s) => {
                  const [bg, fg] = colorOf(s.e.category);
                  return (
                    <button key={`${s.e.id}-${s.a}`} type="button" title={s.e.title}
                      className={`cal-bar${s.left ? " cl" : ""}${s.right ? " cr" : ""}`}
                      style={{ gridColumn: `${s.a + 1} / ${s.b + 2}`, gridRow: s.lane + 1, background: bg, color: fg }}
                      onClick={() => setSel(s.e)}>{s.e.title}</button>
                  );
                })}
                {w.days.map((d, i) => hiddenAt(i) > 0 && (
                  <button key={`m-${d}`} type="button" className="cal-more" style={{ gridColumn: i + 1, gridRow: MAX_LANES + 1 }} onClick={() => setDay(d)}>+{hiddenAt(i)} เพิ่มเติม</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {cats.length > 0 && (
        <div className="cal-legend">
          {cats.map((c) => { const [bg, fg] = colorOf(c); return <span key={c} style={{ background: bg, color: fg }}>{c}</span>; })}
        </div>
      )}

      <h3 style={{ margin: "26px 0 10px" }}>กิจกรรมในเดือนนี้</h3>
      {monthEvents.length ? (
        <ul className="cal-list">
          {monthEvents.map((e) => {
            const [bg, fg] = colorOf(e.category);
            return (
              <li key={e.id}>
                <button type="button" onClick={() => setSel(e)}>
                  <span className="cal-list-date">{shortDate(e.s)}{e.en !== e.s ? ` – ${shortDate(e.en)}` : ""}</span>
                  <b>{e.title}</b>
                  <span className="tag" style={{ background: bg, color: fg }}>{e.category}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : <div className="empty">ไม่มีกิจกรรมในเดือนนี้</div>}

      {(sel || day) && (
        <div className="cal-modal" onClick={close} role="presentation">
          <div className="cal-modal-box" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="cal-x" onClick={close} aria-label="ปิด">×</button>
            {sel ? (
              <>
                {day && <button type="button" className="cal-back" onClick={() => setSel(null)}>← กลับไปรายการวันที่ {shortDate(day)}</button>}
                <span className="tag" style={{ background: colorOf(sel.category)[0], color: colorOf(sel.category)[1] }}>{sel.category}</span>
                <h3 style={{ margin: "10px 0 6px" }}>{sel.title}</h3>
                <p className="meta" style={{ margin: 0 }}>
                  📅 {sel.en === sel.s ? longDate(sel.s) : `${longDate(sel.s)} – ${longDate(sel.en)}`}
                  {sel.en !== sel.s && ` (${diff(sel.s, sel.en) + 1} วัน)`}
                </p>
                <p style={{ whiteSpace: "pre-wrap", marginTop: 14 }}>{sel.description || "ไม่มีรายละเอียดเพิ่มเติม"}</p>
              </>
            ) : (
              <>
                <h3 style={{ margin: "0 0 12px" }}>{longDate(day!)}</h3>
                <ul className="cal-list">
                  {dayEvents.map((e) => (
                    <li key={e.id}>
                      <button type="button" onClick={() => setSel(e)}>
                        <b>{e.title}</b>
                        <span className="tag" style={{ background: colorOf(e.category)[0], color: colorOf(e.category)[1] }}>{e.category}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
