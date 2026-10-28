import { login } from "./actions";
import { hasSupabase } from "@/lib/supabase/server";

export const metadata = { title: "เข้าสู่ระบบครู" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="container">
      <div className="card form-card">
        <h1>🔐 เข้าสู่ระบบสำหรับครู</h1>
        <p className="meta">ครูใช้ เลขบัตรประชาชน 13 หลัก เป็นชื่อผู้ใช้ และรหัสผ่านเริ่มต้นคือ วันเดือนปีเกิด (พ.ศ.) 8 หลัก เช่น เกิด 15 เม.ย. 2530 → 15042530 (ระบบจะให้เปลี่ยนรหัสผ่านเมื่อเข้าครั้งแรก)</p>
        {!hasSupabase && <div className="alert info">ยังไม่ได้เชื่อมต่อ Supabase — ตั้งค่า .env.local ตาม README ก่อน</div>}
        {error && <div className="alert err">{error}</div>}
        <form action={login} className="stack">
          <label>เลขบัตรประชาชน หรืออีเมล<input name="username" type="text" inputMode="text" required autoComplete="username" /></label>
          <label>รหัสผ่าน<input name="password" type="password" required autoComplete="current-password" /></label>
          <button className="btn brand">เข้าสู่ระบบ</button>
        </form>
        <p className="hint" style={{ marginTop: 14 }}>ยังไม่มีบัญชี? ติดต่อผู้ดูแลระบบฝ่ายวิชาการเพื่อสร้างบัญชีให้</p>
      </div>
    </div>
  );
}
