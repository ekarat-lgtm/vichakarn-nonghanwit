import { hasSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/data";
import { setDemoRole } from "@/app/demo/actions";

const roles = [
  ["anon", "ผู้เยี่ยมชม"],
  ["teacher", "ครู"],
  ["editor", "เจ้าหน้าที่ (editor)"],
  ["admin", "แอดมิน"],
] as const;

export default async function DemoBar() {
  if (hasSupabase) return null;
  const { role } = await getSession();
  return (
    <div className="demo-bar" role="region" aria-label="โหมดเดโม">
      <div className="container">
        <span><b>🧪 โหมดเดโม</b> — ข้อมูลตัวอย่าง เก็บชั่วคราวในหน่วยความจำ (รีสตาร์ตแล้วรีเซ็ต) · ดูมุมมองของ:</span>
        <form action={setDemoRole} className="demo-roles">
          {roles.map(([v, label]) => (
            <button key={v} name="role" value={v} className={role === v ? "on" : ""} aria-pressed={role === v}>{label}</button>
          ))}
        </form>
      </div>
    </div>
  );
}
