import { getDocs, getSession, isStaff } from "@/lib/data";
import { DOC_CATEGORIES } from "@/lib/sections";
import DocTable from "@/components/DocTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "คลังเอกสารและแบบฟอร์ม" };

export default async function Documents({
  searchParams,
}: { searchParams: Promise<{ q?: string; cat?: string; year?: string }> }) {
  const { q, cat, year } = await searchParams;
  const [docs, { role }] = await Promise.all([
    getDocs({ q, year, categories: cat ? [cat] : undefined }),
    getSession(),
  ]);
  const years = Array.from({ length: 6 }, (_, i) => String(2569 - i));
  return (
    <>
      <div className="page-head"><div className="container"><h1>📄 คลังเอกสารและแบบฟอร์ม</h1><p>ค้นหาตามชื่อเอกสาร หมวดหมู่ หรือปีการศึกษา</p></div></div>
      <div className="container section">
        {!isStaff(role) && <div className="alert info">🔐 เอกสารภายในสำหรับครูจะแสดงเมื่อ <a href="/login">เข้าสู่ระบบ</a></div>}
        <form className="filters" method="get">
          <input name="q" defaultValue={q} placeholder="ค้นหาชื่อเอกสาร…" style={{ flex: "1 1 220px" }} />
          <select name="cat" defaultValue={cat ?? ""}>
            <option value="">ทุกหมวด</option>
            {DOC_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select name="year" defaultValue={year ?? ""}>
            <option value="">ทุกปีการศึกษา</option>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
          <button className="btn brand">ค้นหา</button>
        </form>
        <DocTable docs={docs} />
      </div>
    </>
  );
}
