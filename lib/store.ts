/* ข้อมูลตัวอย่างสำหรับ "โหมดเดโม" (ใช้เมื่อยังไม่ได้ตั้งค่า Supabase)
   เก็บในหน่วยความจำของเซิร์ฟเวอร์ — รีสตาร์ตแล้วกลับเป็นค่าเริ่มต้น เหมาะสำหรับสาธิตเท่านั้น */
import { NEWS_CATEGORIES, DOC_CATEGORIES } from "@/lib/sections";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export const todayTH = (offset = 0) =>
  new Date(Date.now() + offset * 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

let n = 0;
export const newId = () => `demo-${++n}-${Math.random().toString(36).slice(2, 7)}`;

export const DEMO_USERS = {
  teacher: { uid: "u-t1", email: "demo-teacher@nonghanwit.ac.th", name: "ครูบุ๊ค (ตัวอย่าง)" },
  editor: { uid: "u-e1", email: "demo-editor@nonghanwit.ac.th", name: "เจ้าหน้าที่ฝ่ายวิชาการ (ตัวอย่าง)" },
  admin: { uid: "u-a1", email: "demo-admin@nonghanwit.ac.th", name: "ผู้ดูแลระบบ (ตัวอย่าง)" },
} as const;

const SUBJECTS: [string, string][] = [
  ["คณิตศาสตร์", "ครูสมชาย ใจดี"], ["เคมี", "ครูบุ๊ค (ตัวอย่าง)"], ["ภาษาไทย", "ครูสุดา แสงทอง"],
  ["ภาษาอังกฤษ", "ครูวิชัย มั่นคง"], ["ฟิสิกส์", "ครูนภา พรหมมา"], ["สังคมศึกษา", "ครูอนันต์ ศรีสุข"],
  ["ชีววิทยา", "ครูมาลี สุขสันต์"], ["พลศึกษา", "ครูประเสริฐ บุญมี"], ["ศิลปะ", "ครูรัตนา คำดี"],
];
export const CLASSES = ["ม.1/1", "ม.2/16", "ม.6/2"];
const AREA_OF: Record<string, string> = {
  "คณิตศาสตร์": "คณิตศาสตร์", "เคมี": "วิทยาศาสตร์และเทคโนโลยี", "ภาษาไทย": "ภาษาไทย", "ภาษาอังกฤษ": "ภาษาต่างประเทศ",
  "ฟิสิกส์": "วิทยาศาสตร์และเทคโนโลยี", "สังคมศึกษา": "สังคมศึกษา ศาสนา และวัฒนธรรม", "ชีววิทยา": "วิทยาศาสตร์และเทคโนโลยี",
  "พลศึกษา": "สุขศึกษาและพลศึกษา", "ศิลปะ": "ศิลปะ",
};

function seed(): Record<string, Row[]> {
  const now = new Date().toISOString();
  const withId = (rows: Row[]) => rows.map((r) => ({ id: newId(), created_at: now, ...r }));

  const profiles: Row[] = [
    { id: "u-a1", email: DEMO_USERS.admin.email, full_name: DEMO_USERS.admin.name, role: "admin", learning_area: "อื่น ๆ" },
    { id: "u-e1", email: DEMO_USERS.editor.email, full_name: DEMO_USERS.editor.name, role: "editor" },
    { id: "u-t1", email: DEMO_USERS.teacher.email, full_name: DEMO_USERS.teacher.name, role: "teacher", learning_area: "วิทยาศาสตร์และเทคโนโลยี" },
    ...SUBJECTS.filter(([, t]) => !t.startsWith("ครูบุ๊ค")).map(([s, t], i) => ({
      id: `u-t${i + 2}`, email: `teacher${i + 2}@nonghanwit.ac.th`, full_name: t, role: "teacher", learning_area: AREA_OF[s] ?? null,
    })),
    { id: "u-g1", email: "academic.dept@gmail.com", full_name: "บัญชีกลางฝ่ายวิชาการ", role: "guest" },
  ].map((r) => ({ created_at: now, ...r }));

  const timetable: Row[] = [];
  CLASSES.forEach((c, ci) => {
    for (let d = 1; d <= 5; d++) for (let p = 1; p <= 8; p++) {
      if ((d + p + ci) % 4 === 0) continue; // เว้นบางคาบ (คาบว่าง/กิจกรรม)
      const [subject, teacher] = SUBJECTS[(d * 3 + p * 2 + ci) % SUBJECTS.length];
      timetable.push({ class_name: c, day: d, period: p, subject, teacher_name: teacher,
        room: subject === "เคมี" ? "ห้องปฏิบัติการเคมี" : `ห้อง ${101 + ci}` });
    }
  });

  const tasks = withId([
    { title: "ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 2", category: "การสอน", due_date: todayTH(5), description: "ส่งไฟล์แผนฯ ที่งานหลักสูตร" },
    { title: "ส่งผลการเรียนกลางภาค (ปพ.5)", category: "วัดผล", due_date: todayTH(-3), description: "บันทึกคะแนนในระบบ SGS แล้วแจ้งส่ง" },
    { title: "รายงานการประเมินตนเอง (SAR)", category: "ประกันคุณภาพ", due_date: todayTH(25), description: "รายงานผลการดำเนินงานตามมาตรฐาน" },
  ]);
  const teachers = profiles.filter((p) => p.role !== "guest");
  const submissions = [
    ...teachers.slice(0, 5).map((t) => ({ task_id: tasks[1].id, teacher_id: t.id, teacher_name: t.full_name })),
    ...teachers.slice(0, 3).map((t) => ({ task_id: tasks[0].id, teacher_id: t.id, teacher_name: t.full_name })),
  ].map((r) => ({ id: newId(), submitted_at: now, ...r }));

  const byName = (n: string) => profiles.find((p) => p.full_name === n)?.id;
  const P1 = "ขอเอกสาร ปพ.1 / ใบรับรองผลการเรียน";
  const request_assignees = withId([
    { request_type: P1, level: "*", teacher_id: byName("ครูสมชาย ใจดี") },
    { request_type: P1, level: "ม.1", teacher_id: byName("ครูสุดา แสงทอง") },
  ]);

  return {
    profiles,
    request_assignees,
    settings: [],
    news: withId([
      { title: "ประกาศกำหนดการสอบกลางภาค ภาคเรียนที่ 2", category: NEWS_CATEGORIES[1] ?? NEWS_CATEGORIES[0], body: "กำหนดสอบกลางภาคเรียนที่ 2 ปีการศึกษา 2569 ตามตารางสอบที่แนบ นักเรียนตรวจสอบห้องสอบและเวลาให้เรียบร้อย", published: true, published_at: todayTH(-2) },
      { title: "เปิดรับสมัครกิจกรรมแข่งขันทักษะวิชาการ", category: NEWS_CATEGORIES[0], body: "ครูที่ปรึกษาโครงงานและกิจกรรมแจ้งรายชื่อนักเรียนภายในสัปดาห์นี้", published: true, published_at: todayTH(-7) },
      { title: "ประกาศผลการเรียน ภาคเรียนที่ 1 (ฉบับตัวอย่าง)", category: NEWS_CATEGORIES[2] ?? NEWS_CATEGORIES[0], body: "นักเรียนตรวจสอบผลการเรียนผ่านระบบ SGS ภายในกำหนด", published: true, published_at: todayTH(-30) },
      { title: "[ตั้งเวลา] ประกาศกำหนดการลงทะเบียนเรียนภาคเรียนถัดไป", category: NEWS_CATEGORIES[3] ?? NEWS_CATEGORIES[0], body: "ข่าวนี้ตั้งเวลาเผยแพร่ล่วงหน้า จะแสดงในหน้าเว็บเมื่อถึงวันที่กำหนด", published: true, published_at: todayTH(10) },
      { title: "[ฉบับร่าง] ประกาศแนวปฏิบัติการวัดและประเมินผล", category: NEWS_CATEGORIES[0], body: "ร่างประกาศ ยังไม่เผยแพร่", published: false, published_at: todayTH() },
    ]),
    documents: withId([
      { title: "คู่มือการวัดและประเมินผล (ตัวอย่าง)", category: DOC_CATEGORIES[1] ?? DOC_CATEGORIES[0], academic_year: "2569", description: "แนวปฏิบัติการวัดผลประเมินผล", file_url: "#", visibility: "public", updated_at: todayTH(-5) },
      { title: "แบบฟอร์มแผนการจัดการเรียนรู้ (ตัวอย่าง)", category: DOC_CATEGORIES[3] ?? DOC_CATEGORIES[0], academic_year: "2569", description: "ใช้ส่งงานหลักสูตร", file_url: "#", visibility: "teacher", updated_at: todayTH(-9) },
    ]),
    events: withId([
      { title: "สอบกลางภาคเรียนที่ 2", category: "วัดผล", start_date: todayTH(8), end_date: todayTH(12), description: "" },
      { title: "ส่งผลการเรียนกลางภาค", category: "ครู", start_date: todayTH(15), end_date: null, description: "" },
      { title: "นิเทศการจัดการเรียนรู้", category: "นิเทศ", start_date: todayTH(21), end_date: todayTH(25), description: "" },
    ]),
    services: withId([
      { title: "ระบบ SGS", description: "ระบบบริหารจัดการผลการเรียน", url: "#", icon: "🧮", audience: "public", sort_order: 1 },
      { title: "เอกสารภายในสำหรับครู", description: "Google Drive ฝ่ายวิชาการ", url: "#", icon: "🔒", audience: "teacher", sort_order: 2 },
    ]),
    achievements: withId([
      { title: "รางวัลชนะเลิศโครงงานวิทยาศาสตร์ (ตัวอย่าง)", kind: "โครงงานวิทยาศาสตร์", owner_name: "นักเรียน ม.5", academic_year: "2568", description: "ตัวอย่างข้อมูลผลงาน", image_url: null, link_url: null },
    ]),
    requests: withId([
      { code: "RQ-69-DEMO01", type: "ขอเอกสาร ปพ.1 / ใบรับรองผลการเรียน", requester_name: "นักเรียนตัวอย่าง", class_name: "ม.6/2", contact: "081-000-0000", detail: "ขอ ปพ.1 สำหรับยื่นสมัครเรียนต่อ", status: "กำลังดำเนินการ", response: "งานทะเบียนกำลังตรวจสอบ คาดว่าเสร็จภายใน 3 วันทำการ" },
      { code: "RQ-69-DEMO02", type: "ขอแก้ผลการเรียน (0 / ร / มส)", requester_name: "ผู้ปกครองตัวอย่าง", class_name: "ม.2/16", contact: "082-000-0000", detail: "ขอแก้ไขผลการเรียนวิชาเคมี", status: "เสร็จสิ้น", response: "แก้ไขผลการเรียนเรียบร้อย ติดต่อรับเอกสารที่งานทะเบียน" },
    ]).map((r) => ({ updated_at: now, ...r })),
    tasks,
    submissions,
    timetable: withId(timetable),
    class_notices: withId([
      { class_name: "ม.6/2", title: "ประกาศรายชื่อห้องสอบกลางภาค ม.6/2", body: "ตรวจสอบเลขที่นั่งสอบหน้าห้องเรียน", kind: "ประกาศ", link_url: null },
      { class_name: "ม.2/16", title: "ผลสอบกลางภาควิชาเคมี ม.2/16 (ตัวอย่าง)", body: "คะแนนเฉลี่ยห้อง 72.4 — นักเรียนดูผลรายบุคคลที่หน้า 'ตรวจผลสอบ'", kind: "ผลสอบ", link_url: null },
      { class_name: "ม.1/1", title: "รายชื่อนักเรียนห้อง ม.1/1 ภาคเรียนที่ 2", body: "ตรวจสอบรายชื่อและเลขที่ให้ถูกต้อง", kind: "รายชื่อห้อง", link_url: null },
    ]),
    student_results: withId([
      { student_code: "10001", pin: "1234", student_name: "เด็กชายตัวอย่าง ทดสอบ", exam_name: "สอบกลางภาค ภาคเรียนที่ 2 — เคมี", score: "36 / 50", grade: "—", note: "" },
      { student_code: "10001", pin: "1234", student_name: "เด็กชายตัวอย่าง ทดสอบ", exam_name: "สอบกลางภาค ภาคเรียนที่ 2 — คณิตศาสตร์", score: "41 / 50", grade: "—", note: "" },
    ]),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
export const demo = (): Record<string, Row[]> => (g.__nwDemo ??= seed());
export const demoRows = (table: string): Row[] => [...(demo()[table] ??= [])];
