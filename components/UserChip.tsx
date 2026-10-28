import Link from "next/link";
import { getSession, isEditor } from "@/lib/data";
import { hasSupabase } from "@/lib/supabase/server";
import { isStaffLoginEmail } from "@/lib/nid";
import { ROLE_LABEL } from "@/lib/roles";
import { logout } from "@/app/login/actions";

/** ป้ายแสดงผู้ใช้ที่ล็อกอินอยู่ที่มุมขวาของเฮดเดอร์ (เห็นทุกหน้า ทั้งก่อนและหลังล็อกอิน) */
export default async function UserChip() {
  const { email, role, name, idHint } = await getSession();

  if (!email) {
    return hasSupabase ? (
      <Link href="/login" className="user-chip anon">
        <span className="uc-avatar" aria-hidden>👤</span>
        <span className="uc-text"><small>ผู้เยี่ยมชม</small><b>เข้าสู่ระบบครู</b></span>
      </Link>
    ) : null;
  }

  const display = name ?? email;
  const account = idHint ? `เลขบัตร ลงท้าย ${idHint}` : isStaffLoginEmail(email) ? "เข้าสู่ระบบด้วยเลขบัตร" : email;
  return (
    <div className="nav-dd user-dd">
      <button type="button" className="user-chip" aria-haspopup="true">
        <span className="uc-avatar" aria-hidden>{[...display][0]}</span>
        <span className="uc-text"><small>{ROLE_LABEL[role] ?? role}{!hasSupabase && " · เดโม"}</small><b>{display}</b></span>
        <span aria-hidden>▾</span>
      </button>
      <div className="nav-dd-menu user-menu">
        <div className="nav-dd-title">กำลังใช้งานบัญชี</div>
        <div className="user-menu-info"><b>{display}</b><span>{ROLE_LABEL[role] ?? role}</span><span>{account}</span></div>
        <hr />
        {isEditor(role) && <Link href="/admin">⚙️ จัดการเว็บ</Link>}
        {hasSupabase && <Link href="/account/password">🔑 เปลี่ยนรหัสผ่าน</Link>}
        {hasSupabase && (
          <form action={logout}><button type="submit" className="user-menu-logout">↩ ออกจากระบบ</button></form>
        )}
      </div>
    </div>
  );
}
