import { redirect } from "next/navigation";
import { getSession } from "@/lib/data";
import { changePassword } from "./actions";

export const metadata = { title: "เปลี่ยนรหัสผ่าน" };
export const dynamic = "force-dynamic";

export default async function PasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { email, name } = await getSession();
  if (!email) redirect("/login");
  return (
    <div className="container">
      <div className="card form-card">
        <h1>🔑 เปลี่ยนรหัสผ่าน</h1>
        <p className="meta">บัญชี: {name ?? email} · หากเพิ่งเข้าระบบครั้งแรก กรุณาตั้งรหัสผ่านใหม่แทนรหัสเริ่มต้น (วันเกิด)</p>
        {error && <div className="alert err">{error}</div>}
        <form action={changePassword} className="stack">
          <label>รหัสผ่านใหม่ (อย่างน้อย 8 ตัว มีตัวอักษรอย่างน้อย 1 ตัว)<input name="password" type="password" required minLength={8} autoComplete="new-password" /></label>
          <label>ยืนยันรหัสผ่านใหม่<input name="confirm" type="password" required minLength={8} autoComplete="new-password" /></label>
          <button className="btn brand">บันทึกรหัสผ่านใหม่</button>
        </form>
      </div>
    </div>
  );
}
