import { getServices, getSession, isStaff } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "ระบบบริการออนไลน์" };

export default async function Services() {
  const [services, { role }] = await Promise.all([getServices(), getSession()]);
  const pub = services.filter((s) => s.audience === "public");
  const teacher = services.filter((s) => s.audience === "teacher");
  const card = (x: (typeof services)[number]) => (
    <a key={x.id} className="card link" href={x.url} target="_blank" rel="noreferrer">
      <div className="icon">{x.icon ?? "🔗"}</div>
      <h3 style={{ margin: "6px 0 2px" }}>{x.title}</h3>
      <p className="meta" style={{ margin: 0 }}>{x.description}</p>
    </a>
  );
  return (
    <>
      <div className="page-head"><div className="container"><h1>💻 ระบบบริการออนไลน์</h1><p>รวมลิงก์ระบบที่โรงเรียนใช้งานจริงไว้ในที่เดียว</p></div></div>
      <div className="container section">
        <div className="section-title"><h2>สำหรับทุกคน</h2></div>
        <div className="grid cols-3" style={{ marginBottom: 32 }}>{pub.length ? pub.map(card) : <div className="empty">ยังไม่มีลิงก์</div>}</div>
        <div className="section-title"><h2>🔐 สำหรับครูและบุคลากร</h2></div>
        {isStaff(role)
          ? <div className="grid cols-3">{teacher.length ? teacher.map(card) : <div className="empty">ยังไม่มีลิงก์</div>}</div>
          : <div className="alert info">เข้าสู่ระบบครูเพื่อดูบริการเฉพาะบุคลากร — <a href="/login">เข้าสู่ระบบ</a></div>}
      </div>
    </>
  );
}
