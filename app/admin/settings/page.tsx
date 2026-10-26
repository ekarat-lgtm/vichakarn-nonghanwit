import { settingDefs } from "@/lib/school";
import { getSettings } from "@/lib/data";
import { saveSettings } from "../actions";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  const { msg, err } = await searchParams;
  const s = await getSettings();
  return (
    <>
      {msg && <div className="alert ok">{msg}</div>}
      {err && <div className="alert err">{err}</div>}
      <div className="card" style={{ maxWidth: 640 }}>
        <h2>🛠️ ข้อมูลฝ่ายวิชาการ</h2>
        <p className="meta">ข้อมูลที่ยังไม่มี เว้นว่างไว้ก่อนแล้วเติมภายหลังได้ที่นี่ — จะแสดงในส่วนท้ายเว็บและหน้าติดต่อโดยอัตโนมัติ</p>
        <form action={saveSettings} className="stack">
          {settingDefs.map((d) => (
            <label key={d.key}>
              {d.label}
              <input name={d.key} defaultValue={s[d.key] ?? ""} placeholder={d.hint} />
            </label>
          ))}
          <button className="btn brand">บันทึก</button>
        </form>
      </div>
    </>
  );
}
