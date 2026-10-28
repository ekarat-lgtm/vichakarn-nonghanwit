import { dbSelect } from "@/lib/db";
import { fmtDate, getSession } from "@/lib/data";
import { ANY_LEVEL, REQUEST_STATUSES, REQUEST_TYPES, describeLog, fmtDateTime } from "@/lib/requests";
import { ROLE_LABEL } from "@/lib/roles";
import { LEVELS } from "@/lib/submissions";
import { notifyEmailOf } from "@/lib/teachers";
import { assignRequest, deleteAssignment, saveAssignments, updateRequest } from "../actions";

type Teacher = { id: string; full_name: string | null; role: string; learning_area?: string | null; contact_email?: string | null; email?: string | null; id_hint?: string | null };
const teacherLabel = (t: Teacher) => `${t.full_name ?? "(ไม่มีชื่อ)"}${t.learning_area ? ` · ${t.learning_area}` : ""}${notifyEmailOf(t) ? "" : " · ⚠ ไม่มีอีเมล"}`;

export default async function AdminRequests({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string; s?: string; view?: string }> }) {
  const { msg, err, s, view } = await searchParams;
  const { role } = await getSession();
  const isAdmin = role === "admin";
  const [all, logs, rules, teachers] = await Promise.all([
    dbSelect("requests", { order: { col: "created_at", asc: false }, limit: 300 }),
    dbSelect("request_logs", { order: { col: "created_at", asc: false }, limit: 1000 }),
    isAdmin ? dbSelect("request_assignees", { limit: 500 }) : Promise.resolve([]),
    // editor อ่านโปรไฟล์คนอื่นไม่ได้ (RLS) — รายชื่อครูใช้เฉพาะแอดมิน
    isAdmin ? dbSelect<Teacher>("profiles", { order: { col: "full_name", asc: true }, limit: 500 }) : Promise.resolve([] as Teacher[]),
  ]);
  const staff = teachers.filter((t) => t.role !== "guest");
  const teacherById = new Map(staff.map((t) => [t.id, t]));
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
        {isAdmin && <a href="/admin/requests?view=assign" className={view === "assign" ? "active" : ""}>👤 ผู้รับผิดชอบคำร้อง</a>}
      </div>

      {view === "assign" && isAdmin ? (
        <>
          <div className="card" style={{ padding: 18, marginBottom: 18 }}>
            <h2 style={{ marginTop: 0 }}>👤 กำหนดผู้รับผิดชอบ</h2>
            <p className="hint">เลือกประเภทคำร้อง + ระดับชั้น + ครูผู้ดูแล เมื่อนักเรียนยื่นคำร้องที่ตรงกัน ระบบจะบันทึกผู้รับผิดชอบไว้ที่คำร้องและส่งอีเมลแจ้งครูคนนั้น ·
              กติกาของ “ระดับชั้นเฉพาะ” ใช้ก่อน ถ้าไม่มีจึงใช้กติกา “ทุกระดับ” · ครูที่ไม่มีอีเมลจะรับแจ้งเตือนไม่ได้ (เพิ่มอีเมลที่ <a href="/admin/users">ผู้ใช้/สิทธิ์</a>)</p>
            <form action={saveAssignments} className="stack">
              <label>ประเภทคำร้อง
                <select name="type" required>{REQUEST_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              </label>
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend style={{ fontWeight: 600, marginBottom: 6 }}>ระดับชั้น (เลือกได้หลายระดับ)</legend>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <label style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 400 }}><input type="checkbox" name="levels" value={ANY_LEVEL} /> ทุกระดับ</label>
                  {LEVELS.map((l) => <label key={l} style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 400 }}><input type="checkbox" name="levels" value={l} /> {l}</label>)}
                </div>
              </fieldset>
              <label>ครูผู้รับผิดชอบ
                <select name="teacher" required defaultValue="">
                  <option value="" disabled>— เลือกครู —</option>
                  {staff.map((t) => <option key={t.id} value={t.id}>{teacherLabel(t)}</option>)}
                </select>
              </label>
              <button className="btn brand">บันทึกผู้รับผิดชอบ</button>
            </form>
          </div>

          <div className="table-wrap">
            <table>
              <thead><tr><th>ประเภทคำร้อง</th>{LEVELS.map((l) => <th key={l}>{l}</th>)}</tr></thead>
              <tbody>
                {REQUEST_TYPES.map((t) => {
                  const any = rules.find((r) => r.request_type === t && r.level === ANY_LEVEL);
                  return (
                    <tr key={t}>
                      <td>{t}</td>
                      {LEVELS.map((l) => {
                        const own = rules.find((r) => r.request_type === t && r.level === l);
                        const rule = own ?? any;
                        const name = rule ? teacherById.get(rule.teacher_id)?.full_name ?? "(ไม่พบบัญชี)" : null;
                        return <td key={l} className={own ? "" : "meta"}>{name ?? <span style={{ color: "#b45309" }}>— ยังไม่กำหนด</span>}{!own && name ? " *" : ""}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="hint">* = ใช้กติกา “ทุกระดับ” ของประเภทนั้น</p>

          <h3>กติกาที่ตั้งไว้</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>ประเภทคำร้อง</th><th>ระดับ</th><th>ครูผู้รับผิดชอบ</th><th></th></tr></thead>
              <tbody>
                {rules.length ? [...rules].sort((a, b) => REQUEST_TYPES.indexOf(a.request_type) - REQUEST_TYPES.indexOf(b.request_type) || (a.level === ANY_LEVEL ? -1 : b.level === ANY_LEVEL ? 1 : a.level.localeCompare(b.level))).map((r) => {
                  const t = teacherById.get(r.teacher_id);
                  return (
                    <tr key={r.id}>
                      <td>{r.request_type}</td>
                      <td>{r.level === ANY_LEVEL ? "ทุกระดับ" : r.level}</td>
                      <td>{t ? teacherLabel(t) : "(ไม่พบบัญชี)"}</td>
                      <td><form action={deleteAssignment.bind(null, r.id)}><button className="btn small">ลบ</button></form></td>
                    </tr>
                  );
                }) : <tr><td colSpan={4} className="meta">ยังไม่มีกติกา — คำร้องใหม่จะยังไม่มีผู้รับผิดชอบ</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      ) : view === "log" ? (
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
              {r.requester_name}{r.class_name || r.level ? ` · ${r.class_name ?? r.level}` : ""}{r.contact ? ` · ติดต่อ ${r.contact}` : ""} · ยื่นเมื่อ {fmtDate(r.created_at)}
            </p>
            {r.detail && <p>{r.detail}</p>}
            <p className="meta" style={{ margin: "6px 0" }}>
              {r.assignee_name ? <>👤 ผู้รับผิดชอบ: <b>{r.assignee_name}</b> · </> : "👤 ยังไม่มีผู้รับผิดชอบ · "}
              {r.notified_at ? <>✉️ แจ้งเตือนทางอีเมลแล้ว {fmtDateTime(r.notified_at)}</>
                : r.notify_error ? <span style={{ color: "#b45309" }}>⚠️ ส่งอีเมลไม่สำเร็จ: {r.notify_error}</span>
                : r.assignee_name ? "✉️ ยังไม่ได้ส่งอีเมล" : null}
            </p>
            {isAdmin && REQUEST_STATUSES.slice(0, 2).includes(r.status) && (
              <details style={{ marginBottom: 6 }}>
                <summary>มอบหมาย / เปลี่ยนผู้รับผิดชอบ และส่งอีเมลแจ้ง</summary>
                <form action={assignRequest.bind(null, r.id)} className="req-form">
                  <select name="teacher" required defaultValue={r.assignee_id ?? ""} style={{ flex: 1, minWidth: 220 }}>
                    <option value="" disabled>— เลือกครู —</option>
                    {staff.map((t) => <option key={t.id} value={t.id}>{teacherLabel(t)}</option>)}
                  </select>
                  <button className="btn small">มอบหมาย + ส่งอีเมล</button>
                </form>
              </details>
            )}
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
