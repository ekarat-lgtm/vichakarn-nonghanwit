"use client";
/* ฟอร์มแจ้งส่งงานครู: กรอกข้อมูล → ไฟล์ไปที่ Google Drive โดยตรง → บันทึกเฉพาะข้อความลงฐานข้อมูล */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordSubmission, startUpload } from "@/app/submit/actions";
import { ALLOWED_EXT, LEARNING_AREAS, LEVELS, MAX_FILES, MAX_FILE_MB } from "@/lib/submissions";

type Task = { label: string; url: string; note: string };

function putFile(url: string, file: File, onProgress: (p: number) => void): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url);
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    x.onload = () => {
      if (x.status < 200 || x.status >= 300) return reject(new Error(`อัปโหลดไม่สำเร็จ (${x.status})`));
      try { resolve(JSON.parse(x.responseText)); } catch { reject(new Error("คำตอบจาก Google ไม่ถูกต้อง")); }
    };
    x.onerror = () => reject(new Error("เชื่อมต่อ Google Drive ไม่ได้ — ตรวจอินเทอร์เน็ตแล้วลองใหม่"));
    x.send(file);
  });
}

export default function SubmitForm({ tasks, uploadReady, year, semester }: { tasks: Task[]; uploadReady: boolean; year: string; semester: string }) {
  const router = useRouter();
  const [taskUrl, setTaskUrl] = useState(tasks[0]?.url ?? "");
  const [levels, setLevels] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const task = tasks.find((t) => t.url === taskUrl);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const f = (k: string) => String(fd.get(k) ?? "").trim();
    const files = (fd.getAll("files") as File[]).filter((x) => x.size > 0);
    setError(""); setDone(false);
    if (!levels.length) return setError("กรุณาเลือกระดับชั้นอย่างน้อย 1 ระดับ");
    if (uploadReady && (!files.length || files.length > MAX_FILES)) return setError(`กรุณาแนบไฟล์ 1–${MAX_FILES} ไฟล์`);
    setBusy(true);
    try {
      const fileIds: string[] = [];
      for (const [i, file] of files.entries()) {
        setStatus(`กำลังอัปโหลดไฟล์ ${i + 1}/${files.length}: ${file.name} (0%)`);
        const s = await startUpload({ taskUrl, subject: f("subject"), levels: levels.join("-"), fileName: file.name, mime: file.type, size: file.size });
        if (!s.ok) throw new Error(s.error);
        const up = await putFile(s.url, file, (p) => setStatus(`กำลังอัปโหลดไฟล์ ${i + 1}/${files.length}: ${file.name} (${Math.round(p * 100)}%)`));
        fileIds.push(up.id);
      }
      setStatus("กำลังบันทึกการแจ้งส่ง…");
      const r = await recordSubmission({
        taskUrl, area: f("area"), subject: f("subject"), levels, room: f("room"), year: f("year"), semester: f("semester"), note: f("note"),
        fileIds, manualName: f("manualName"), manualUrl: f("manualUrl"),
      });
      if (!r.ok) throw new Error(r.error);
      form.reset(); setLevels([]); setDone(true); router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false); setStatus("");
    }
  }

  if (!tasks.length) return <div className="empty">ฝ่ายวิชาการยังไม่ได้ตั้งค่าโฟลเดอร์ส่งงาน</div>;
  const toggle = (l: string) => setLevels((c) => (c.includes(l) ? c.filter((x) => x !== l) : [...c, l]));

  return (
    <form onSubmit={onSubmit} className="stack">
      {done && <div className="alert ok">✅ แจ้งส่งงานเรียบร้อยแล้ว — ฝ่ายวิชาการเห็นรายการของคุณแล้ว</div>}
      {error && <div className="alert err">{error}</div>}

      <label>งานที่ส่ง *
        <select value={taskUrl} onChange={(e) => setTaskUrl(e.target.value)} required>
          {tasks.map((t) => <option key={t.url} value={t.url}>{t.label}</option>)}
        </select>
        {task?.note && <span className="hint">{task.note}</span>}
      </label>
      <label>กลุ่มสาระการเรียนรู้ *
        <select name="area" required defaultValue="">
          <option value="" disabled>— เลือก —</option>
          {LEARNING_AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
      </label>
      <label>รายวิชา (รหัสวิชา ชื่อวิชา) *<input name="subject" required maxLength={120} placeholder="เช่น ว31101 ชีววิทยา 1" /></label>
      <fieldset className="level-pick">
        <legend>ระดับชั้นที่สอน *</legend>
        {LEVELS.map((l) => (
          <label key={l} className={levels.includes(l) ? "on" : ""}>
            <input type="checkbox" checked={levels.includes(l)} onChange={() => toggle(l)} /> {l}
          </label>
        ))}
      </fieldset>
      <label>ห้อง (ถ้ามี)<input name="room" maxLength={40} placeholder="เช่น 1-3 หรือ 2,4" /></label>
      <div className="grid cols-2">
        <label>ปีการศึกษา<input name="year" defaultValue={year} maxLength={8} /></label>
        <label>ภาคเรียน<input name="semester" defaultValue={semester} maxLength={4} /></label>
      </div>

      {uploadReady ? (
        <label>แนบไฟล์ (สูงสุด {MAX_FILES} ไฟล์, ไฟล์ละไม่เกิน {MAX_FILE_MB} MB) *
          <input type="file" name="files" multiple accept={ALLOWED_EXT.map((x) => "." + x).join(",")} />
          <span className="hint">ไฟล์จะถูกเก็บใน Google Drive ของฝ่ายวิชาการ ไม่ได้เก็บในฐานข้อมูลของเว็บ</span>
        </label>
      ) : (
        <div className="card" style={{ padding: 14 }}>
          <p className="hint" style={{ marginTop: 0 }}>
            ขั้นที่ 1: <a href={taskUrl} target="_blank" rel="noreferrer noopener"><b>เปิดโฟลเดอร์ส่งงาน ↗</b></a> แล้วลากไฟล์ไปวาง · ขั้นที่ 2: กรอกชื่อไฟล์ด้านล่างแล้วกดแจ้งส่ง
          </p>
          <label>ชื่อไฟล์ที่อัปโหลดไว้ใน Drive *<input name="manualName" required maxLength={160} /></label>
          <label>ลิงก์ไฟล์ (ถ้ามี)<input name="manualUrl" type="url" placeholder="https://drive.google.com/…" /></label>
        </div>
      )}

      <label>หมายเหตุ (ถ้ามี)<textarea name="note" maxLength={500} rows={2} /></label>
      <button className="btn brand" disabled={busy}>{busy ? "กำลังดำเนินการ…" : "ส่งงาน / แจ้งส่ง"}</button>
      {status && <p className="hint" role="status">{status}</p>}
    </form>
  );
}
