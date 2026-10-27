import Link from "next/link";
import { fmtDate, getNotices } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "ประกาศห้องเรียนและผลสอบ" };

const kinds = ["ทั้งหมด", "ประกาศ", "ผลสอบ", "รายชื่อห้อง", "ตารางสอบ"];

export default async function Classes({ searchParams }: { searchParams: Promise<{ class?: string; kind?: string }> }) {
  const { class: cls, kind } = await searchParams;
  const all = await getNotices();
  const classes = [...new Set(all.map((n) => n.class_name))].sort();
  const rows = all.filter((n) => (!cls || n.class_name === cls || n.class_name === "ทุกห้อง") && (!kind || kind === "ทั้งหมด" || n.kind === kind));
  const tagCls = (k: string) => (k === "ผลสอบ" ? "tag gold" : "tag");
  return (
    <>
      <div className="page-head"><div className="container"><h1>🏫 ประกาศห้องเรียนและผลสอบ</h1><p>ประกาศรายห้อง รายชื่อห้องเรียน ตารางสอบ และผลสอบ</p></div></div>
      <div className="container section">
        <div className="card" style={{ marginBottom: 22, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div><b>🔎 ตรวจผลสอบรายบุคคล</b><br /><span className="meta">ใช้รหัสนักเรียน + PIN ที่ได้รับจากโรงเรียน</span></div>
          <Link href="/results" className="btn brand">ไปหน้าตรวจผลสอบ</Link>
        </div>
        <form className="filters" action="/classes">
          <select name="class" defaultValue={cls ?? ""} aria-label="เลือกห้อง">
            <option value="">ทุกห้อง</option>
            {classes.filter((c) => c !== "ทุกห้อง").map((c) => <option key={c}>{c}</option>)}
          </select>
          <select name="kind" defaultValue={kind ?? "ทั้งหมด"} aria-label="ประเภท">{kinds.map((k) => <option key={k}>{k}</option>)}</select>
          <button className="btn brand small">กรอง</button>
        </form>
        {rows.length ? (
          <div className="grid cols-2">
            {rows.map((n) => (
              <div className="card" key={n.id}>
                <p style={{ margin: 0 }}><span className={tagCls(n.kind)}>{n.kind}</span> <span className="tag">{n.class_name}</span></p>
                <h3 style={{ margin: "8px 0 4px" }}>{n.title}</h3>
                {n.body && <p>{n.body}</p>}
                <p className="meta" style={{ margin: 0 }}>
                  {fmtDate(n.created_at)}{n.link_url && <> · <a href={n.link_url} target="_blank" rel="noreferrer">เปิดไฟล์แนบ</a></>}
                </p>
              </div>
            ))}
          </div>
        ) : <div className="empty">ไม่มีประกาศตามเงื่อนไขที่เลือก</div>}
      </div>
    </>
  );
}
