import { getAchievements } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "ผลงานและนวัตกรรมทางวิชาการ" };

export default async function Achievements() {
  const items = await getAchievements();
  return (
    <>
      <div className="page-head"><div className="container"><h1>🏆 ผลงานและนวัตกรรมทางวิชาการ</h1><p>ผลงานครู นักเรียน นวัตกรรมการจัดการเรียนรู้ และรางวัลแห่งความภาคภูมิใจ</p></div></div>
      <div className="container section">
        {items.length ? (
          <div className="grid cols-3">
            {items.map((a) => (
              <div className="card" key={a.id}>
                {a.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image_url} alt={a.title} style={{ borderRadius: 10, marginBottom: 10, aspectRatio: "4/3", objectFit: "cover", width: "100%" }} />
                )}
                <span className="tag gold">{a.kind}</span>
                <h3 style={{ margin: "6px 0 2px" }}>{a.title}</h3>
                <p className="meta">{[a.owner_name, a.academic_year && `ปีการศึกษา ${a.academic_year}`].filter(Boolean).join(" · ")}</p>
                {a.description && <p>{a.description}</p>}
                {a.link_url && <a href={a.link_url} target="_blank" rel="noreferrer">ดูรายละเอียด →</a>}
              </div>
            ))}
          </div>
        ) : <div className="empty">ยังไม่มีผลงาน — ผู้ดูแลเพิ่มได้ที่ /admin/achievements</div>}
      </div>
    </>
  );
}
