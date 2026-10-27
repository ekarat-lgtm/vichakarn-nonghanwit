import { dbSelect } from "@/lib/db";
import { fmtDate } from "@/lib/data";
import { REQUEST_STATUSES } from "@/lib/requests";
import { updateRequest } from "../actions";

export default async function AdminRequests({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string; s?: string }> }) {
  const { msg, err, s } = await searchParams;
  const all = await dbSelect("requests", { order: { col: "created_at", asc: false }, limit: 300 });
  const rows = s ? all.filter((r) => r.status === s) : all;
  const count = (st: string) => all.filter((r) => r.status === st).length;
  return (
    <>
      {msg && <div className="alert ok">{msg}</div>}
      {err && <div className="alert err">{err}</div>}
      <div className="admin-tabs">
        <a href="/admin/requests" className={!s ? "active" : ""}>ทั้งหมด ({all.length})</a>
        {REQUEST_STATUSES.map((x) => <a key={x} href={`/admin/requests?s=${encodeURIComponent(x)}`} className={s === x ? "active" : ""}>{x} ({count(x)})</a>)}
      </div>
      {rows.length ? rows.map((r) => (
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
        </div>
      )) : <div className="empty">ไม่มีคำร้องในหมวดนี้</div>}
    </>
  );
}
