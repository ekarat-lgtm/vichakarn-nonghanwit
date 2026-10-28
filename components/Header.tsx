import Link from "next/link";
import { school } from "@/lib/school";
import { getSession, isEditor, isStaff } from "@/lib/data";
import UserChip from "@/components/UserChip";

type Item = { href: string; label: string };
type Group = { key: string; label: string; items: Item[]; note?: string };

/* เมนูจัดเป็นหมวด — เพิ่ม/ย้ายหน้าได้ที่นี่ที่เดียว */
const GROUPS: Group[] = [
  {
    key: "academic", label: "งานวิชาการ",
    items: [
      { href: "/curriculum", label: "หลักสูตร" },
      { href: "/teaching", label: "การเรียนการสอน" },
      { href: "/registrar", label: "ทะเบียนและวัดผล" },
      { href: "/quality", label: "นิเทศ/ประกันคุณภาพ" },
      { href: "/student-development", label: "พัฒนาผู้เรียน" },
      { href: "/documents", label: "คลังเอกสาร" },
    ],
  },
  {
    key: "student", label: "สำหรับนักเรียน",
    items: [
      { href: "/classes", label: "ประกาศห้องเรียน" },
      { href: "/results", label: "ตรวจผลสอบ" },
      { href: "/timetable", label: "ตารางสอน" },
      { href: "/requests", label: "ยื่นคำร้องออนไลน์" },
      { href: "/requests#track", label: "ติดตามสถานะคำร้อง" },
    ],
  },
  {
    key: "teacher", label: "สำหรับครู",
    items: [
      { href: "/submit", label: "📁 ส่งงาน (Google Drive)" },
      { href: "/tracking", label: "✅ ติดตามงาน" },
      { href: "/services", label: "ระบบบริการออนไลน์" },
    ],
  },
  {
    key: "more", label: "เพิ่มเติม",
    items: [
      { href: "/achievements", label: "ผลงานและนวัตกรรม" },
      { href: "/about", label: "เกี่ยวกับโรงเรียน" },
    ],
  },
];

export default async function Header() {
  const { role } = await getSession();
  const staff = isStaff(role);
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
            <Link href="/news">ข่าวประชาสัมพันธ์</Link>
            <Link href="/calendar">ปฏิทิน</Link>
            {GROUPS.map((g) => (
              <div className="nav-dd" key={g.key}>
                <button type="button" className="nav-dd-trigger" aria-haspopup="true">{g.label} <span aria-hidden>▾</span></button>
                <div className="nav-dd-menu">
                  <div className="nav-dd-title">{g.label}</div>
                  {g.key === "teacher" && !staff && (
                    <Link href="/login" className="nav-dd-lock">🔒 เข้าสู่ระบบครูเพื่อใช้งานเมนูนี้</Link>
                  )}
                  {g.items.map((i) => (
                    <Link key={i.href} href={g.key === "teacher" && !staff ? "/login" : i.href}>{i.label}</Link>
                  ))}
                  {g.key === "teacher" && isEditor(role) && (
                    <>
                      <hr />
                      <div className="nav-dd-title">สำหรับเจ้าหน้าที่</div>
                      <Link href="/admin">⚙️ จัดการเว็บ</Link>
                      <Link href="/admin/requests">📨 จัดการคำร้อง</Link>
                      <Link href="/admin/requests?view=log">🕘 ประวัติการแก้ไขคำร้อง</Link>
                      <Link href="/admin/tracking">📊 ติดตามการส่งงาน</Link>
                    </>
                  )}
                </div>
              </div>
            ))}
            <UserChip />
          </nav>
        </div>
      </header>
    </>
  );
}
