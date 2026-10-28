import { dbSelect } from "@/lib/db";
import { getSession } from "@/lib/data";
import { createTeacher, importTeachers, resetStaffPasswordAction, updateUserRole } from "../actions";

const roleLabel: Record<string, string> = { guest: "guest — ล็อกอินได้ ยังไม่เห็นเนื้อหาครู", teacher: "teacher — ครู", editor: "editor — เพิ่ม/แก้ข่าวเอกสาร", admin: "admin — ผู้ดูแลทั้งหมด" };
const newRoleLabel = Object.fromEntries(Object.entries(roleLabel).filter(([k]) => k !== "guest"));

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  const { msg, err } = await searchParams;
  const { role, uid } = await getSession();
  if (role !== "admin") return <div className="alert err">หน้านี้สำหรับแอดมินเท่านั้น</div>;
  const users = await dbSelect("profiles", { order: { col: "full_name", asc: true }, limit: 500 });
  return (
    <>
      {msg && <div className="alert ok">{msg}</div>}
      {err && <div className="alert err">{err}</div>}

      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>➕ เพิ่มบัญชีครู</h2>
        <p className="hint">ครูล็อกอินด้วย <b>เลขบัตรประชาชน</b> + รหัสผ่านเริ่มต้นคือ <b>วันเกิด (พ.ศ.) ววดดปปปป</b> และถูกบังคับให้เปลี่ยนรหัสเมื่อเข้าครั้งแรก · ระบบไม่เก็บเลขบัตรในฐานข้อมูล (เก็บเฉพาะ 4 หลักท้ายไว้ให้แยกบัญชี)</p>
        <form action={createTeacher} className="stack">
          <label>เลขบัตรประชาชน (13 หลัก)<input name="nid" inputMode="numeric" maxLength={17} required autoComplete="off" /></label>
          <label>ชื่อ-สกุล<input name="name" required autoComplete="off" /></label>
          <label>วันเกิด (วว/ดด/ปปปป พ.ศ. เช่น 15/04/2530)<input name="birth" required placeholder="15/04/2530" autoComplete="off" /></label>
          <label>สิทธิ์
            <select name="role" defaultValue="teacher">
              {Object.entries(newRoleLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <button className="btn brand">เพิ่มบัญชี</button>
        </form>
        <details style={{ marginTop: 16 }}>
          <summary><b>นำเข้าหลายคนพร้อมกัน</b> (วางจาก Excel ได้)</summary>
          <form action={importTeachers} className="stack" style={{ marginTop: 10 }}>
            <label>1 บรรทัดต่อ 1 คน: เลขบัตร, ชื่อ-สกุล, วันเกิด [, สิทธิ์ — ไม่ใส่ = teacher]
              <textarea name="rows" rows={8} placeholder={"1100100000000, ครูสมชาย ใจดี, 15/04/2530\n1100100000001, ครูสุดา แสงทอง, 02/11/2525, editor"} />
            </label>
            <button className="btn brand">นำเข้า</button>
          </form>
        </details>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>ชื่อ</th><th>บัญชี</th><th>สิทธิ์</th><th>รีเซ็ตรหัสผ่าน</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.full_name}{u.id === uid && <span className="tag gold" style={{ marginLeft: 8 }}>คุณ</span>}
                </td>
                <td>{u.id_hint ? `เลขบัตร ลงท้าย ${u.id_hint}` : u.email}</td>
                <td>
                  <form action={updateUserRole.bind(null, u.id)} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <select name="role" defaultValue={u.role}>
                      {Object.entries(roleLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                    <button className="btn brand small">บันทึก</button>
                  </form>
                </td>
                <td>
                  <details>
                    <summary>รีเซ็ต…</summary>
                    <form action={resetStaffPasswordAction.bind(null, u.id)} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                      <input name="birth" required placeholder="วันเกิด 15/04/2530" autoComplete="off" />
                      <button className="btn small">ตั้งเป็นวันเกิด</button>
                    </form>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
