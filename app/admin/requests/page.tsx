import { dbSelect } from "@/lib/db";
import { fmtDate } from "@/lib/data";
import { REQUEST_STATUSES, describeLog, fmtDateTime } from "@/lib/requests";
import { ROLE_LABEL } from "@/lib/roles";
import { updateRequest } from "../actions";

export default async function AdminRequests({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string; s?: string; view?: string }> }) {
  const { msg, err, s, view } = await searchParams;
  const [all, logs] = await Promise.all([
    dbSelect("requests", { order: { col: "created_at", asc: false }, limit: 300 }),
    dbSelect("request_logs", { order: { col: "created_at", asc: false }, limit: 1000 }),
  ]);
  const rows = s ? all.filter((r) => r.status === s) : all;
  const count = (st: string) => all.filter((r) => r.status === st).length;
  const logsOf = (id: string) => logs.filter((l) => l.request_id === id);
  return (
    <>
      {msg && <div className="alert ok">{msg}</div>}
      {err && <div className="alert err">{err}</div>}
      <div className="admin-tabs">
        <a href="/admin/requests" className={!s && view !== "log" ? "active" : ""}>ทั้งหมด ({all.length})</a>
        {REQUEST_STATUSES.map((x) => <a key={x} href={`/admin/requests?s=${encodeURIComponent(x)}`} className={s === x ? "active" : ""}>{x} ({count(x)})</a>)}
        <a href="/admin/requests?view=log" className={view === "log" ? "active" : ""}>🕘 ประวัติการแก้ไข ({logs.length})</a>
      </div>

      {view === "log" ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>วันเวลา</th><th>ผู้แก้ไข</th><th>คำร้อง</th><th>สิ่งที่เปลี่ยน</th></tr></thead>
            <tbody>
              {logs.length ? logs.map((l) => (
                <tr key={l.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(l.created_at)}</td>
                  <td><b>{l.editor_name}</b><div className="meta">{ROLE_LABEL[l.editor_role] ?? l.editor_role}</div></td>
                  <td>{l.request_code}</td>
                  <td>{describeLog(l).map((t, i) => <div key={i}>{t}</div>)}</td>
                </tr>
              )) : <tr><td colSpan={4} className="meta">ยังไม่มีประวัติการแก้ไข</td></tr>}
            </tbody>
          </table>
        </div>
      ) : rows.length ? rows.map((r) => {
        const rl = logsOf(r.id);
        return (
          <div className="card req-card" key={r.id}>
            <div className="req-head">
              <div><b>{r.code}</b> · <span className="tag gold">{r.type}</span></div>
              <span className={`status st-${REQUEST_STATUSES.indexOf(r.status)}`}>{r.status}</span>
            </div>
            <p className="meta" style={{ margin: "6px 0" }}>
              {r.requester_name}{r.class_name ? ` · ${r.class_name}` : ""}{r.contact ? ` · ติดต่อ ${r.contact}` : ""} · ยื่นเมื่อ {fmtDate(r.created_at)}
            </p>
            {r.detail && <p>{r.detail}</p>}
            <form action={updateRequest.bind(null, r.id)} className="req-form">
              <select name="status" defaultValue={r.status}>{REQUEST_STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
              <input name="response" defaultValue={r.response ?? ""} placeholder="ข้อความตอบกลับถึงผู้ยื่นคำร้อง" />
              <button className="btn brand small">บันทึก</button>
            </form>
            <p className="meta" style={{ margin: "10px 0 0" }}>
              {rl.length ? <>แก้ไขล่าสุดโดย <b>{rl[0].editor_name}</b> · {fmtDateTime(rl[0].created_at)}</> : "ยังไม่เคยมีการแก้ไข"}
            </p>
            {rl.length > 0 && (
              <details className="req-log">
                <summary>ประวัติการแก้ไข ({rl.length})</summary>
                <ul>
                  {rl.map((l) => (
                    <li key={l.id}>
                      <b>{fmtDateTime(l.created_at)}</b> — {l.editor_name} <span className="meta">({ROLE_LABEL[l.editor_role] ?? l.editor_role})</span>
                      {describeLog(l).map((t, i) => <div key={i} className="meta">{t}</div>)}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        );
      }) : <div className="empty">ไม่มีคำร้องในหมวดนี้</div>}
    </>
  );
}
