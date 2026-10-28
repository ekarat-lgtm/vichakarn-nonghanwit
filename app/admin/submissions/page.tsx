import Link from "next/link";
import { getSettings } from "@/lib/data";
import { dbSelect } from "@/lib/db";
import { getDriveLinks } from "@/lib/drive";
import { fmtDateTime } from "@/lib/requests";
import { LEARNING_AREAS, type Submission } from "@/lib/submissions";

export const dynamic = "force-dynamic";

export default async function AdminSubmissions({ searchParams }: { searchParams: Promise<{ task?: string; area?: string }> }) {
  const { task, area } = await searchParams;
  const [links, s] = await Promise.all([getDriveLinks(), getSettings()]);
  const year = s.current_year ?? "", sem = s.current_semester ?? "";
  let all: Submission[] = [];
  let missingTable = false;
  try {
    all = (await dbSelect("work_submissions", { order: { col: "created_at", asc: false }, limit: 1000 })) as unknown as Submission[];
  } catch { missingTable = true; }
  if (missingTable) return <div className="alert err">ยังไม่พบตาราง work_submissions — รัน supabase/schema_v5.sql ก่อน</div>;

  const term = all.filter((x) => (!year || x.academic_year === year) && (!sem || x.semester === sem));
  const rows = term.filter((x) => (!task || x.task_url === task) && (!area || x.learning_area === area));

  // ใครส่งแล้ว/ยังไม่ส่ง สำหรับงานที่เลือก (ภาคเรียนปัจจุบัน)
  let pending: string[] = [];
  if (task) {
    const profs = (await dbSelect("profiles", { order: { col: "full_name", asc: true }, limit: 500 })) as unknown as { id: string; full_name: string | null; role: string }[];
    const sent = new Set(term.filter((x) => x.task_url === task).map((x) => x.user_id));
    pending = profs.filter((p) => ["teacher", "editor"].includes(p.role) && !sent.has(p.id)).map((p) => p.full_name ?? "(ไม่มีชื่อ)");
  }
  const sentCount = new Set(term.filter((x) => x.task_url === task).map((x) => x.user_id)).size;

  return (
    <>
      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>📥 งานที่ครูแจ้งส่ง — ภาคเรียน {sem}/{year}</h2>
        <form method="get" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select name="task" defaultValue={task ?? ""}>
            <option value="">ทุกงาน</option>
            {links.map((l) => <option key={l.url} value={l.url}>{l.label}</option>)}
          </select>
          <select name="area" defaultValue={area ?? ""}>
            <option value="">ทุกกลุ่มสาระ</option>
            {LEARNING_AREAS.map((a) => <option key={a}>{a}</option>)}
          </select>
          <button className="btn brand small">กรอง</button>
          {(task || area) && <Link href="/admin/submissions" className="btn small secondary" style={{ color: "var(--brand)", borderColor: "var(--line)" }}>ล้าง</Link>}
        </form>
        {task && (
          <div style={{ marginTop: 14 }}>
            <p><b>ส่งแล้ว {sentCount} คน · ยังไม่ส่ง {pending.length} คน</b></p>
            {pending.length > 0 && <p className="meta">ยังไม่ส่ง: {pending.join(", ")}</p>}
          </div>
        )}
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>เวลา</th><th>ครู</th><th>กลุ่มสาระ</th><th>รายวิชา / ระดับ</th><th>งาน</th><th>ไฟล์</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{fmtDateTime(r.created_at)}</td>
                <td>{r.teacher_name}</td>
                <td>{r.learning_area}</td>
                <td>{r.subject}<div className="meta">{r.levels}</div>{r.note && <div className="meta">“{r.note}”</div>}</td>
                <td>{r.task_label}</td>
                <td>{(r.files ?? []).map((f, i) => <div key={i}>{f.url ? <a href={f.url} target="_blank" rel="noreferrer noopener">📎 {f.name}</a> : <>📎 {f.name}</>}</div>)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6}><div className="empty">ยังไม่มีรายการ</div></td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
