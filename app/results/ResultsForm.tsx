"use client";

import { useActionState } from "react";
import { lookupResults, type LookupState } from "./actions";

export default function ResultsForm({ demoHint }: { demoHint: boolean }) {
  const [state, action, pending] = useActionState<LookupState, FormData>(lookupResults, {});
  return (
    <>
      <form action={action} className="stack">
        <label>รหัสนักเรียน<input name="code" required inputMode="numeric" autoComplete="off" defaultValue={state.code ?? ""} /></label>
        <label>PIN ตรวจผลสอบ<input name="pin" type="password" required autoComplete="off" /></label>
        <button className="btn brand" disabled={pending}>{pending ? "กำลังตรวจสอบ…" : "ตรวจผลสอบ"}</button>
        {demoHint && <p className="hint">เดโม: รหัส <b>10001</b> · PIN <b>1234</b></p>}
      </form>
      {state.error && <div className="alert err" style={{ marginTop: 14 }}>{state.error}</div>}
      {state.rows && (
        <div style={{ marginTop: 18 }}>
          <h3>{state.rows[0].student_name}</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>รายการสอบ</th><th>คะแนน</th><th>ผลการเรียน</th><th>หมายเหตุ</th></tr></thead>
              <tbody>
                {state.rows.map((r, i) => (
                  <tr key={i}><td>{r.exam_name}</td><td>{r.score}</td><td>{r.grade}</td><td>{r.note}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint">ปิดหน้านี้หลังดูผลเสร็จ เพื่อความเป็นส่วนตัว</p>
        </div>
      )}
    </>
  );
}
