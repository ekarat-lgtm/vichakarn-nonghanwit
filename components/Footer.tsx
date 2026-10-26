import { school } from "@/lib/school";
import { getSettings } from "@/lib/data";

export default async function Footer() {
  const s = await getSettings();
  return (
    <footer className="site-footer">
      <div className="container grid cols-3">
        <div>
          <h3>{school.nameTh}</h3>
          <p>{school.address}</p>
          <p className="meta">{school.affiliation}</p>
        </div>
        <div>
          <h3>ติดต่อ{school.deptName}</h3>
          <p>
            {s.academic_head && <>{s.academic_head}<br />{s.academic_head_title}<br /></>}
            โทร {s.academic_phone || school.phone}
            {school.fax && <> · โทรสาร {school.fax}</>}
            <br />
            ✉️ {s.academic_email || school.email}
          </p>
        </div>
        <div>
          <h3>ลิงก์</h3>
          <p>
            <a href={school.links.mainSite} target="_blank" rel="noreferrer">เว็บไซต์หลักโรงเรียน</a><br />
            <a href={school.links.googleSite} target="_blank" rel="noreferrer">Google Sites โรงเรียน</a><br />
            <a href={s.academic_facebook || school.links.facebook} target="_blank" rel="noreferrer">Facebook</a><br />
            <a href={school.links.sesa20} target="_blank" rel="noreferrer">สพม.อุดรธานี (เขต 20)</a>
          </p>
        </div>
      </div>
      <div className="container copy">
        © {new Date().getFullYear() + 543} {school.deptName} {school.nameTh} · ข้อมูลโรงเรียนอ้างอิงจากเว็บไซต์ทางการของโรงเรียน
      </div>
    </footer>
  );
}
