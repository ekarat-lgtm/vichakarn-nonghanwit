import Link from "next/link";
import type { News } from "@/lib/data";

export default function NewsList({ items }: { items: News[] }) {
  if (!items.length) return <div className="empty">ยังไม่มีข่าวประชาสัมพันธ์</div>;
  return (
    <div className="card">
      {items.map((n) => {
        const d = new Date(n.published_at);
        return (
          <div className="news-item" key={n.id}>
            <div className="datebox">
              <b>{d.getDate()}</b>
              <span>{d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" })}</span>
            </div>
            <div>
              <span className="tag gold">{n.category}</span>
              <h3 style={{ margin: "6px 0 2px" }}>
                <Link href={`/news/${n.id}`}>{n.title}</Link>
              </h3>
              {n.body && <p className="meta" style={{ margin: 0 }}>{n.body.slice(0, 140)}{n.body.length > 140 ? "…" : ""}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
