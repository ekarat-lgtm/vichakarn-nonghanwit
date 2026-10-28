import Link from "next/link";
import { school } from "@/lib/school";
import { getSession, isEditor, isStaff } from "@/lib/data";
import { logout } from "@/app/login/actions";
import { hasSupabase } from "@/lib/supabase/server";
import { REQUEST_TYPES } from "@/lib/requests";

const nav = [
  { href: "/news", label: "ข่าวประชาสัมพันธ์" },
  { href: "/curriculum", label: "หลักสูตร" },
  { href: "/registrar", label: "ทะเบียนและวัดผล" },
  { href: "/teaching", label: "การเรียนการสอน" },
  { href: "/quality", label: "นิเทศ/ประกันคุณภาพ" },
  { href: "/documents", label: "คลังเอกสาร" },
  { href: "/requests", label: "คำร้อง" },
  { href: "/timetable", label: "ตารางสอน" },
  { href: "/classes", label: "ประกาศ/ผลสอบ" },
  { href: "/achievements", label: "ผลงาน" },
  { href: "/calendar", label: "ปฏิทิน" },
  { href: "/services", label: "บริการออนไลน์" },
];

export default async function Header() {
  const { email, role, name } = await getSession();
  return (
    <>
      <div className="topbar">
        <div className="container">
          <span>📞 {school.phone} · ✉️ {school.email}</span>
          <span>
            <a href={school.links.mainSite} target="_blank" rel="noreferrer">เว็บไซต์หลักโรงเรียน</a>
          </span>
        </div>
      </div>
      <header className="site-header">
        <div className="container">
          <Link href="/" className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={school.images.logo} alt={`ตราโรงเรียน${school.nameTh}`} />
            <span>
              <b>{school.deptName}</b>
              <small>{school.nameTh}</small>
            </span>
          </Link>
          <input type="checkbox" id="menu-check" />
          <label htmlFor="menu-check" className="menu-toggle">☰ เมนู</label>
          <nav className="nav">
            {nav.map((n) => n.href === "/requests" ? (
              <div className="nav-dd" key={n.href}>
                <Link href="/requests" className="nav-dd-trigger">{n.label} <span aria-hidden>▾</span></Link>
                <div className="nav-dd-menu">
                  <div className="nav-dd-title">ยื่นคำร้อง</div>
                  {REQUEST_TYPES.map((t) => <Link key={t} href={`/requests?type=${encodeURIComponent(t)}#form`} className="nav-dd-type">{t}</Link>)}
                  <hr />
                  <Link href="/requests#track">🔍 ติดตามสถานะคำร้อง</Link>
                  {isEditor(role) && (
                    <>
                      <hr />
                      <div className="nav-dd-title">สำหรับเจ้าหน้าที่</div>
                      <Link href="/admin/requests">⚙️ จัดการคำร้อง</Link>
                      <Link href="/admin/requests?view=log">🕘 ประวัติการแก้ไขคำร้อง</Link>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <Link key={n.href} href={n.href}>{n.label}</Link>
            ))}
            {isStaff(role) && <Link href="/tracking">✅ ติดตามงาน</Link>}
            {isEditor(role) && <Link href="/admin">⚙️ จัดการเว็บ</Link>}
            {!hasSupabase ? null : email ? (
              <form action={logout} style={{ display: "inline" }}>
                <button className="btn small brand" title={name ?? email}>ออกจากระบบ</button>
              </form>
            ) : (
              <Link href="/login" className="login">เข้าสู่ระบบครู</Link>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
