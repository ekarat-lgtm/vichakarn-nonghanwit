import Link from "next/link";
import { notFound } from "next/navigation";
import { findTable } from "@/lib/adminConfig";
import { dbSelect } from "@/lib/db";
import { getSession } from "@/lib/data";
import { updateRow } from "../../actions";
import AdminForm from "@/components/AdminForm";

export default async function EditRow({
  params, searchParams,
}: {
  params: Promise<{ table: string; id: string }>;
  searchParams: Promise<{ msg?: string; err?: string }>;
}) {
  const { table, id } = await params;
  const { err } = await searchParams;
  const cfg = findTable(table);
  if (!cfg) notFound();
  const { role } = await getSession();
  if (cfg.adminOnly && role !== "admin") return <div className="alert err">หน้านี้สำหรับแอดมินเท่านั้น</div>;
  const [row] = await dbSelect(cfg.table, { eq: { id }, limit: 1 });
  if (!row) notFound();
  return (
    <>
      {err && <div className="alert err">{err}</div>}
      <div className="card" style={{ maxWidth: 640 }}>
        <h2>✏️ แก้ไข{cfg.label}</h2>
        <AdminForm cfg={cfg} action={updateRow.bind(null, cfg.table, id)} values={row} submitLabel="บันทึกการแก้ไข" />
        <p style={{ marginTop: 14 }}><Link href={`/admin/${cfg.table}`}>← กลับไปรายการ</Link></p>
      </div>
    </>
  );
}
