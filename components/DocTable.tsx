import type { Doc } from "@/lib/data";
import { fmtDate } from "@/lib/data";

export default function DocTable({ docs, showCategory = true }: { docs: Doc[]; showCategory?: boolean }) {
  if (!docs.length) {
    return <div className="empty">ยังไม่มีเอกสารในหมวดนี้ — ผู้ดูแลเพิ่มได้ที่เมนู “จัดการเว็บ”</div>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ชื่อเอกสาร</th>
            {showCategory && <th>หมวด</th>}
            <th>ปีการศึกษา</th>
            <th>ปรับปรุง</th>
            <th>ดาวน์โหลด</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id}>
              <td>
                <b>{d.title}</b>
                {d.visibility === "teacher" && <> <span className="tag gold">เฉพาะครู</span></>}
                {d.description && <div className="meta">{d.description}</div>}
              </td>
              {showCategory && <td><span className="tag">{d.category}</span></td>}
              <td>{d.academic_year ?? "-"}</td>
              <td>{fmtDate(d.updated_at)}</td>
              <td>
                <a className="btn small brand" href={d.file_url} target="_blank" rel="noreferrer">เปิด / ดาวน์โหลด</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
