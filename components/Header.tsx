import Link from "next/link";
import { school } from "@/lib/school";
import { getSession, isEditor, isStaff } from "@/lib/data";
import { logout } from "@/app/login/actions";
import { hasSupabase } from "@/lib/supabase/server";

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
  const { email, role } = await getSession();
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
            {nav.map((n) => (
              <Link key={n.href} href={n.href}>{n.label}</Link>
            ))}
            {isStaff(role) && <Link href="/tracking">✅ ติดตามงาน</Link>}
            {isEditor(role) && <Link href="/admin">⚙️ จัดการเว็บ</Link>}
            {!hasSupabase ? null : email ? (
              <form action={logout} style={{ display: "inline" }}>
                <button className="btn small brand" title={email}>ออกจากระบบ</button>
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
