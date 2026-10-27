import { dbSelect } from "@/lib/db";
import { getSession } from "@/lib/data";
import { updateUserRole } from "../actions";

const roleLabel: Record<string, string> = { guest: "guest — ล็อกอินได้ ยังไม่เห็นเนื้อหาครู", teacher: "teacher — ครู", editor: "editor — เพิ่ม/แก้ข่าวเอกสาร", admin: "admin — ผู้ดูแลทั้งหมด" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  const { msg, err } = await searchParams;
  const { role, uid } = await getSession();
  if (role !== "admin") return <div className="alert err">หน้านี้สำหรับแอดมินเท่านั้น</div>;
  const users = await dbSelect("profiles", { order: { col: "email", asc: true }, limit: 500 });
  return (
    <>
      {msg && <div className="alert ok">{msg}</div>}
      {err && <div className="alert err">{err}</div>}
      <div className="alert info">สร้างบัญชีใหม่ที่ Supabase → Authentication → Users → Add user แล้วกลับมากำหนดสิทธิ์ที่นี่ (อีเมล @nonghanwit.ac.th ได้สิทธิ์ครูอัตโนมัติ)</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ชื่อ</th><th>อีเมล</th><th>สิทธิ์</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}{u.id === uid && <span className="tag gold" style={{ marginLeft: 8 }}>คุณ</span>}</td>
                <td>{u.email}</td>
                <td colSpan={2}>
                  <form action={updateUserRole.bind(null, u.id)} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <select name="role" defaultValue={u.role}>
                      {Object.entries(roleLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                    <button className="btn brand small">บันทึก</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
