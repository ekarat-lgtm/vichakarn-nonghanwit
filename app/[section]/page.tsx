import { notFound } from "next/navigation";
import Link from "next/link";
import { findSection, sections } from "@/lib/sections";
import { getDocs, getSession, isStaff } from "@/lib/data";
import DocTable from "@/components/DocTable";

export const dynamic = "force-dynamic";
export const dynamicParams = false;

export function generateStaticParams() {
  return sections.map((s) => ({ section: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const sec = findSection((await params).section);
  return { title: sec?.title };
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const sec = findSection((await params).section);
  if (!sec) notFound();
  const [docs, { role }] = await Promise.all([getDocs({ categories: sec.docCategories }), getSession()]);
  return (
    <>
      <div className="page-head"><div className="container"><h1>{sec.icon} {sec.title}</h1><p>{sec.intro}</p></div></div>
      <div className="container section">
        {sec.note && <div className="alert info">ℹ️ {sec.note}</div>}
        <div className="card" style={{ marginBottom: 28 }}>
          <h2>หัวข้อในหมวดนี้</h2>
          <ul className="topics">{sec.topics.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
        <div className="section-title">
          <h2>เอกสารในหมวดนี้</h2>
          <Link href={`/documents?cat=${encodeURIComponent(sec.docCategories[0])}`}>ค้นหาในคลังเอกสาร →</Link>
        </div>
        {!isStaff(role) && <p className="meta">เอกสารเฉพาะครูจะแสดงเมื่อเข้าสู่ระบบ</p>}
        <DocTable docs={docs} />
      </div>
    </>
  );
}
