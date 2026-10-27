import Link from "next/link";
import { notFound } from "next/navigation";
import { findTable } from "@/lib/adminConfig";
import { dbSelect } from "@/lib/db";
import { getSession } from "@/lib/data";
import { todayTH } from "@/lib/store";
import { createRow, deleteRow, togglePublished } from "../actions";
import AdminForm from "@/components/AdminForm";

function cell(table: string, col: string, r: Record<string, any>) {
  const v = r[col];
  if (col === "published") {
    const future = r.published_at && String(r.published_at).slice(0, 10) > todayTH();
    return v ? (future ? "⏰ ตั้งเวลา" : "✅ เผยแพร่") : "📝 ฉบับร่าง";
  }
  if (col === "day") return ["", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์"][Number(v)] ?? String(v ?? "");
  if (col === "pin") return "••••";
  const s = String(v ?? "");
  return s.length > 80 ? s.slice(0, 80) + "…" : s;
}

export default async function AdminTable({
  params, searchParams,
}: {
  params: Promise<{ table: string }>;
  searchParams: Promise<{ msg?: string; err?: string }>;
}) {
  const { table } = await params;
  const { msg, err } = await searchParams;
  const cfg = findTable(table);
  if (!cfg) notFound();
  const { role } = await getSession();
  if (cfg.adminOnly && role !== "admin") {
    return <div className="alert err">หน้านี้สำหรับแอดมินเท่านั้น</div>;
  }
  const rows = await dbSelect(cfg.table, { order: { col: cfg.order.col, asc: cfg.order.asc }, limit: 300 });
  const create = createRow.bind(null, cfg.table);

  return (
    <>
      {msg && <div className="alert ok">{msg}</div>}
      {err && <div className="alert err">{err}</div>}
      {cfg.table === "student_results" && (
        <div className="alert info">⚠️ ข้อมูลผลสอบรายบุคคลเป็นข้อมูลส่วนบุคคล — ควรได้รับความยินยอมและเปิดให้ดูเฉพาะเจ้าของข้อมูลผ่านรหัสนักเรียน + PIN</div>
      )}
      <div className="admin-grid">
        <div className="card">
          <h2>{cfg.icon} เพิ่ม{cfg.label}</h2>
          <AdminForm cfg={cfg} action={create} />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>{cfg.columns.map((c) => <th key={c}>{c}</th>)}<th /></tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((r) => (
                <tr key={r.id}>
                  {cfg.columns.map((c) => <td key={c}>{cell(cfg.table, c, r)}</td>)}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link href={`/admin/${cfg.table}/${r.id}`} className="btn brand small">แก้ไข</Link>{" "}
                    {cfg.publishToggle && (
                      <form action={togglePublished.bind(null, cfg.table, r.id)} className="inline-form">
                        <button className="btn secondary-dark small">{r.published ? "ซ่อน" : "เผยแพร่"}</button>
                      </form>
                    )}{" "}
                    <form action={deleteRow.bind(null, cfg.table, r.id)} className="inline-form">
                      <button className="btn danger small">ลบ</button>
                    </form>
                  </td>
                </tr>
              )) : <tr><td colSpan={cfg.columns.length + 1} className="meta">ยังไม่มีข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
