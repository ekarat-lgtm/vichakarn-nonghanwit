import Link from "next/link";
import { school } from "@/lib/school";
import { sections } from "@/lib/sections";
import { getNews, getDocs, getEvents, getServices, getSession, getSettings, isStaff } from "@/lib/data";
import { todayTH } from "@/lib/store";
import MiniCalendar from "@/components/MiniCalendar";
import NewsList from "@/components/NewsList";
import DocTable from "@/components/DocTable";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [news, docs, events, services, { role }, s] = await Promise.all([
    getNews(5),
    getDocs({ limit: 6 }),
    getEvents(false, 500),
    getServices(),
    getSession(),
    getSettings(),
  ]);
  const quick = services.filter((x) => x.audience === "public" || isStaff(role)).slice(0, 8);

  return (
    <>
      <section className="hero">
        <div className="slides">
          {school.images.hero.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" />
          ))}
        </div>
        <div className="container">
          <div className="inner">
            <span className="badge">ปีการศึกษา {s.current_year} · ภาคเรียนที่ {s.current_semester}</span>
            <h1>{school.deptName}<br />{school.nameTh}</h1>
            <p>ศูนย์กลางข้อมูลงานวิชาการสำหรับผู้บริหาร ครู นักเรียน และผู้ปกครอง — ข่าวสาร หลักสูตร ทะเบียนวัดผล คลังเอกสาร และบริการออนไลน์</p>
            <Link href="/documents" className="btn">คลังเอกสาร</Link>
            <Link href="/services" className="btn secondary">บริการออนไลน์</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-title"><h2>🆕 บริการออนไลน์ของฝ่ายวิชาการ</h2></div>
          <div className="grid cols-4" style={{ marginBottom: 40 }}>
            {[
              ["📨", "ยื่นคำร้องออนไลน์", "แก้ผลการเรียน ขอ ปพ.1 ติดตามสถานะ", "/requests"],
              ["🗓️", "ตารางสอน", "ดูตามห้องเรียนหรือครูผู้สอน", "/timetable"],
              ["🏫", "ประกาศห้องเรียน/ผลสอบ", "ประกาศรายห้อง รายชื่อ ตารางสอบ", "/classes"],
              ["🔎", "ตรวจผลสอบรายบุคคล", "รหัสนักเรียน + PIN", "/results"],
            ].map(([icon, title, desc, href]) => (
              <Link key={href} href={href} className="card link">
                <div className="icon">{icon}</div>
                <h3 style={{ margin: "6px 0 2px" }}>{title}</h3>
                <p className="meta" style={{ margin: 0 }}>{desc}</p>
              </Link>
            ))}
          </div>
          <div className="section-title"><h2>⚡ ทางลัดบริการ</h2></div>
          <div className="grid cols-4">
            {quick.length ? quick.map((x) => (
              <a key={x.id} className="card link" href={x.url} target="_blank" rel="noreferrer">
                <div className="icon">{x.icon ?? "🔗"}</div>
                <h3 style={{ margin: "6px 0 2px" }}>{x.title}</h3>
                <p className="meta" style={{ margin: 0 }}>{x.description}</p>
              </a>
            )) : <div className="empty" style={{ gridColumn: "1/-1" }}>ยังไม่มีลิงก์บริการ — เพิ่มที่ /admin/services</div>}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container grid" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)" }}>
          <div>
            <div className="section-title"><h2>📢 ข่าวประชาสัมพันธ์ล่าสุด</h2><Link href="/news">ดูทั้งหมด →</Link></div>
            <NewsList items={news} />
          </div>
          <div>
            <div className="section-title"><h2>📅 กำหนดการ</h2></div>
            <div className="card">
              <MiniCalendar
                today={todayTH()}
                events={events.map((e) => ({ id: e.id, title: e.title, category: e.category, start_date: e.start_date, end_date: e.end_date, description: e.description }))}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-title"><h2>🗂️ หมวดงานวิชาการ</h2></div>
          <div className="grid cols-3">
            {sections.map((sec) => (
              <Link key={sec.slug} href={`/${sec.slug}`} className="card link">
                <div className="icon">{sec.icon}</div>
                <h3 style={{ margin: "6px 0" }}>{sec.title}</h3>
                <p className="meta" style={{ margin: 0 }}>{sec.intro}</p>
              </Link>
            ))}
            <Link href="/achievements" className="card link">
              <div className="icon">🏆</div>
              <h3 style={{ margin: "6px 0" }}>ผลงานและนวัตกรรมทางวิชาการ</h3>
              <p className="meta" style={{ margin: 0 }}>ผลงานครู นักเรียน นวัตกรรม และรางวัล</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-title"><h2>📄 เอกสารดาวน์โหลดล่าสุด</h2><Link href="/documents">คลังเอกสาร →</Link></div>
          <DocTable docs={docs} />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-title"><h2>🖼️ ภาพกิจกรรม</h2><a href={school.links.mainSite} target="_blank" rel="noreferrer">ดูเพิ่มเติม →</a></div>
          <div className="gallery">
            {school.images.gallery.map((g) => (
              <figure key={g.src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.src} alt={g.caption} loading="lazy" />
                <figcaption>{g.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container card">
          <h2>🏫 เกี่ยวกับโรงเรียน</h2>
          <p><b>วิสัยทัศน์:</b> {school.vision}</p>
          <p><b>คำขวัญ:</b> {school.motto}</p>
          <Link href="/about" className="btn brand">ประวัติ วิสัยทัศน์ และพันธกิจ</Link>
        </div>
      </section>
    </>
  );
}
