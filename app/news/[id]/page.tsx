import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsItem, fmtDate } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NewsDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = await getNewsItem(id);
  if (!n) notFound();
  return (
    <div className="container section" style={{ maxWidth: 820 }}>
      <Link href="/news">← ข่าวทั้งหมด</Link>
      <article className="card" style={{ marginTop: 12 }}>
        <span className="tag gold">{n.category}</span>
        <h1 style={{ marginTop: 8 }}>{n.title}</h1>
        <p className="meta">เผยแพร่ {fmtDate(n.published_at)}</p>
        {n.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={n.image_url} alt={n.title} style={{ borderRadius: 12, marginBottom: 16 }} />
        )}
        {n.body && <p style={{ whiteSpace: "pre-wrap" }}>{n.body}</p>}
        {n.link_url && <a className="btn brand" href={n.link_url} target="_blank" rel="noreferrer">เปิดลิงก์ที่เกี่ยวข้อง</a>}
      </article>
    </div>
  );
}
