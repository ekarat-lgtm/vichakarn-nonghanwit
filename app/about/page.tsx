import { school } from "@/lib/school";

export const metadata = { title: "เกี่ยวกับโรงเรียน" };

export default function About() {
  return (
    <>
      <div className="page-head"><div className="container">
        <h1>🏫 {school.nameTh}</h1><p>{school.nameEn}</p>
      </div></div>
      <div className="container section grid cols-2">
        <div className="card">
          <h2>ข้อมูลทั่วไป</h2>
          <p><b>ที่ตั้ง:</b> {school.address}</p>
          <p><b>สังกัด:</b> {school.affiliation}</p>
          <p><b>ระดับที่เปิดสอน:</b> {school.levels}</p>
          <p><b>วันสถาปนา:</b> {school.founded}</p>
          <p><b>ผู้อำนวยการ:</b> {school.director}</p>
          <p><b>รองผู้อำนวยการ:</b><br />{school.deputies.join(" · ")}</p>
          <p><b>อักษรย่อ:</b> {school.shortName} · <b>คำขวัญ:</b> {school.motto}</p>
          <p className="hint">สีประจำโรงเรียน ต้นไม้ประจำโรงเรียน และความหมายตราสัญลักษณ์ — ยังไม่มีข้อมูล เพิ่มภายหลังที่ไฟล์ lib/school.ts</p>
        </div>
        <div className="card">
          <h2>วิสัยทัศน์</h2>
          <p>{school.vision}</p>
          <h2>พันธกิจ</h2>
          <ol>{school.missions.map((m) => <li key={m}>{m}</li>)}</ol>
        </div>
        <div className="card" style={{ gridColumn: "1/-1" }}>
          <h2>ประวัติโดยสังเขป</h2>
          <p>โรงเรียนหนองหานวิทยาเป็นโรงเรียนมัธยมศึกษา ตั้งอยู่ในเขตคูเมืองเก่าของเมืองหนองหาน ซึ่งเคยเป็นสนามม้าเก่าของอำเภอหนองหาน ก่อตั้งเมื่อวันที่ 15 กุมภาพันธ์ พ.ศ. 2509 และเปิดทำการสอนเมื่อวันที่ 11 กรกฎาคม พ.ศ. 2509 (วันสถาปนาโรงเรียน) รับนักเรียนแบบสหศึกษา นักเรียนรุ่นแรก 27 คน</p>
          <p>ปีการศึกษา 2547 ได้รับคัดเลือกเป็นโรงเรียนในโครงการหนึ่งอำเภอหนึ่งโรงเรียนในฝัน ปีการศึกษา 2553 เข้าร่วมโครงการโรงเรียนมาตรฐานสากล เปิดห้องเรียน World Class ปีการศึกษา 2557 เป็นสถานศึกษาพอเพียงต้นแบบและได้รับการรับรองต้นแบบโรงเรียนสุจริต และปีการศึกษา 2558 ได้รับการรับรองเป็นโรงเรียนต้นแบบ สพฐ. ใสสะอาด ปราศจากคอรัปชั่น</p>
          <a className="btn brand" href={school.links.mainSite} target="_blank" rel="noreferrer">อ่านเพิ่มเติมที่เว็บไซต์โรงเรียน</a>
        </div>
      </div>
    </>
  );
}
