import Link from "next/link";
import { getSession } from "@/lib/data";
import { hasSupabase } from "@/lib/supabase/server";
import { isStaffLoginEmail } from "@/lib/nid";
import { ROLE_LABEL } from "@/lib/roles";
import { logout } from "@/app/login/actions";

/** แถบด้านล่างที่ลอยอยู่ทุกหน้า แสดงว่าตอนนี้ใช้งานด้วยบัญชีใด */
export default async function AccountBar() {
  if (!hasSupabase) return null;
  const { email, role, name, idHint } = await getSession();
  if (!email) return null;
  const account = idHint ? `เลขบัตร ลงท้าย ${idHint}` : isStaffLoginEmail(email) ? "เข้าสู่ระบบด้วยเลขบัตร" : email;
  return (
    <div className="account-bar" role="status">
      <div className="container">
        <span className="ab-dot" aria-hidden />
        <span>กำลังใช้งานบัญชี: <b>{name ?? email}</b></span>
        <span className="ab-role">{ROLE_LABEL[role] ?? role}</span>
        <span className="ab-acct">{account}</span>
        <span className="ab-actions">
          <Link href="/account/password">เปลี่ยนรหัสผ่าน</Link>
          <form action={logout}><button type="submit">ออกจากระบบ</button></form>
        </span>
      </div>
    </div>
  );
}
