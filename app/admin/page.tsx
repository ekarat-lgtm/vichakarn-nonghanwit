import Link from "next/link";
import { adminTables } from "@/lib/adminConfig";
import { createClient } from "@/lib/supabase/server";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const sb = await createClient();
  const counts = await Promise.all(
    adminTables.map(async (t) => {
      const r = await sb?.from(t.table).select("*", { count: "exact", head: true });
      return r?.count ?? 0;
    }),
  );
  return (
    <>
      {msg && <div className="alert info">{msg}</div>}
      <div className="grid cols-3">
        {adminTables.map((t, i) => (
          <Link key={t.table} href={`/admin/${t.table}`} className="card link">
            <div className="icon">{t.icon}</div>
            <h3>{t.label}</h3>
            <p className="meta">{counts[i]} รายการ</p>
          </Link>
        ))}
        <Link href="/admin/settings" className="card link">
          <div className="icon">🛠️</div>
          <h3>ข้อมูลฝ่ายวิชาการ</h3>
          <p className="meta">เบอร์โทร อีเมล LINE Facebook ลิงก์ปฏิทิน</p>
        </Link>
      </div>
    </>
  );
}
