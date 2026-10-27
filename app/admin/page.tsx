import Link from "next/link";
import { adminTables } from "@/lib/adminConfig";
import { dbSelect } from "@/lib/db";
import { getSession } from "@/lib/data";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const { role } = await getSession();
  const tables = adminTables.filter((t) => !t.adminOnly || role === "admin");
  const counts = await Promise.all(tables.map(async (t) => (await dbSelect(t.table, { limit: 1000 })).length));
  const pending = (await dbSelect("requests", { eq: { status: "รอดำเนินการ" } })).length;
  return (
    <>
      {msg && <div className="alert info">{msg}</div>}
      <div className="grid cols-3">
        {tables.map((t, i) => (
          <Link key={t.table} href={`/admin/${t.table}`} className="card link">
            <div className="icon">{t.icon}</div>
            <h3>{t.label}</h3>
            <p className="meta">{counts[i]} รายการ</p>
          </Link>
        ))}
        <Link href="/admin/requests" className="card link">
          <div className="icon">📨</div>
          <h3>คำร้อง</h3>
          <p className="meta">{pending} รายการรอดำเนินการ</p>
        </Link>
        <Link href="/admin/tracking" className="card link">
          <div className="icon">📊</div>
          <h3>ติดตามการส่งงานครู</h3>
          <p className="meta">ดูว่าใครส่งแล้ว/ยังไม่ส่ง + ข้อความแจ้งเตือน</p>
        </Link>
        {role === "admin" && (
          <Link href="/admin/users" className="card link">
            <div className="icon">👥</div>
            <h3>ผู้ใช้/สิทธิ์</h3>
            <p className="meta">กำหนดสิทธิ์ครู editor admin</p>
          </Link>
        )}
        <Link href="/admin/settings" className="card link">
          <div className="icon">🛠️</div>
          <h3>ข้อมูลฝ่ายวิชาการ</h3>
          <p className="meta">เบอร์โทร อีเมล LINE Facebook ลิงก์ปฏิทิน</p>
        </Link>
      </div>
    </>
  );
}
