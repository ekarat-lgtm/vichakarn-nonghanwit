import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isEditor } from "@/lib/data";
import { adminTables } from "@/lib/adminConfig";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { email, role, name } = await getSession();
  if (!email) redirect("/login");
  if (!isEditor(role)) {
    return (
      <div className="container section">
        <div className="alert err">
          บัญชี {name ?? email} ยังไม่มีสิทธิ์จัดการเว็บ (สิทธิ์ปัจจุบัน: {role}) — ให้แอดมินตั้ง role เป็น editor หรือ admin ในตาราง profiles
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="page-head"><div className="container"><h1>⚙️ จัดการเว็บไซต์งานวิชาการ</h1><p>เข้าสู่ระบบเป็น {name ?? email} ({role})</p></div></div>
      <div className="container section">
        <div className="admin-tabs">
          <Link href="/admin">ภาพรวม</Link>
          {adminTables.filter((t) => !t.adminOnly || role === "admin").map((t) => <Link key={t.table} href={`/admin/${t.table}`}>{t.icon} {t.label}</Link>)}
          <Link href="/admin/requests">📨 คำร้อง</Link>
          <Link href="/admin/tracking">📊 ติดตามการส่งงาน</Link>
          {role === "admin" && <Link href="/admin/users">👥 ผู้ใช้/สิทธิ์</Link>}
          <Link href="/admin/settings">🛠️ ข้อมูลฝ่ายวิชาการ</Link>
        </div>
        {children}
      </div>
    </>
  );
}
