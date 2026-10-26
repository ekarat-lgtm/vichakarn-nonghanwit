import { notFound } from "next/navigation";
import { findTable } from "@/lib/adminConfig";
import { createClient } from "@/lib/supabase/server";
import { createRow, deleteRow } from "../actions";

export default async function AdminTable({
  params,
  searchParams,
}: {
  params: Promise<{ table: string }>;
  searchParams: Promise<{ msg?: string; err?: string }>;
}) {
  const { table } = await params;
  const { msg, err } = await searchParams;
  const cfg = findTable(table);
  if (!cfg) notFound();

  const sb = await createClient();
  const { data } = (await sb
    ?.from(cfg.table)
    .select("*")
    .order(cfg.order.col, { ascending: cfg.order.asc })
    .limit(300)) ?? { data: [] };
  const rows = (data ?? []) as Record<string, any>[];

  const create = createRow.bind(null, cfg.table);

  return (
    <>
      {msg && <div className="alert ok">{msg}</div>}
      {err && <div className="alert err">{err}</div>}
      <div className="admin-grid">
        <div className="card">
          <h2>{cfg.icon} เพิ่ม{cfg.label}</h2>
          <form action={create} className="stack">
            {cfg.fields.map((f) => (
              <label key={f.name}>
                {f.label}{f.required && " *"}
                {f.type === "textarea" ? (
                  <textarea name={f.name} required={f.required} />
                ) : f.type === "select" ? (
                  <select name={f.name} defaultValue={f.options?.[0]}>
                    {f.options?.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : f.type === "file" ? (
                  <input type="file" name={f.name} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg" />
                ) : (
                  <input
                    name={f.name}
                    type={f.type === "url" ? "url" : f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                    required={f.required}
                    defaultValue={f.defaultValue}
                  />
                )}
                {f.hint && <span className="hint">{f.hint}</span>}
              </label>
            ))}
            <button className="btn brand">บันทึก</button>
          </form>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>{cfg.columns.map((c) => <th key={c}>{c}</th>)}<th /></tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((r) => (
                <tr key={r.id}>
                  {cfg.columns.map((c) => <td key={c}>{String(r[c] ?? "")}</td>)}
                  <td>
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
