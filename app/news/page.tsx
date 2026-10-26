import Link from "next/link";
import { getNews } from "@/lib/data";
import { NEWS_CATEGORIES } from "@/lib/sections";
import NewsList from "@/components/NewsList";

export const dynamic = "force-dynamic";
export const metadata = { title: "ข่าวประชาสัมพันธ์" };

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const items = await getNews(100, cat);
  return (
    <>
      <div className="page-head"><div className="container"><h1>📢 ข่าวประชาสัมพันธ์</h1><p>ข่าวสารและประกาศของกลุ่มบริหารวิชาการ</p></div></div>
      <div className="container section">
        <div className="admin-tabs">
          <Link href="/news" className={!cat ? "active" : ""}>ทั้งหมด</Link>
          {NEWS_CATEGORIES.map((c) => (
            <Link key={c} href={`/news?cat=${encodeURIComponent(c)}`} className={cat === c ? "active" : ""}>{c}</Link>
          ))}
        </div>
        <NewsList items={items} />
      </div>
    </>
  );
}
