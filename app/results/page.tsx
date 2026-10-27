import { hasSupabase } from "@/lib/supabase/server";
import ResultsForm from "./ResultsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "ตรวจผลสอบรายบุคคล" };

export default function Results() {
  return (
    <>
      <div className="page-head"><div className="container"><h1>🔎 ตรวจผลสอบรายบุคคล</h1><p>กรอกรหัสนักเรียนและ PIN ที่ได้รับจากโรงเรียน</p></div></div>
      <div className="container section">
        <div className="card form-card" style={{ margin: "0 auto" }}>
          <ResultsForm demoHint={!hasSupabase} />
        </div>
        <p className="meta" style={{ textAlign: "center", marginTop: 14 }}>ผลสอบเป็นข้อมูลส่วนบุคคล โปรดอย่าเปิดเผย PIN ให้ผู้อื่น</p>
      </div>
    </>
  );
}
