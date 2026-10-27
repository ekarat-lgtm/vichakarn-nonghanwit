import { DOC_CATEGORIES, NEWS_CATEGORIES } from "@/lib/sections";

export type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "url" | "file" | "number" | "bool";
  required?: boolean;
  options?: string[];
  hint?: string;
  defaultValue?: string;
  uploadTo?: string; // type "file": เก็บลิงก์ไฟล์ที่อัปโหลดลงฟิลด์นี้
  accept?: string;
  labels?: [string, string]; // type "bool": ข้อความของ true/false
};

export type TableCfg = {
  table: string;
  label: string;
  icon: string;
  fields: Field[];
  columns: string[]; // คอลัมน์ที่แสดงในตาราง
  order: { col: string; asc: boolean };
  publishToggle?: boolean; // แสดงปุ่มเผยแพร่/ซ่อน
  adminOnly?: boolean;
};

const today = () => new Date().toISOString().slice(0, 10);

export const adminTables: TableCfg[] = [
  {
    table: "news", label: "ข่าวประชาสัมพันธ์", icon: "📢",
    order: { col: "published_at", asc: false },
    publishToggle: true,
    columns: ["title", "category", "published", "published_at"],
    fields: [
      { name: "title", label: "หัวข้อข่าว", type: "text", required: true },
      { name: "category", label: "หมวดข่าว", type: "select", options: NEWS_CATEGORIES },
      { name: "published", label: "สถานะ", type: "bool", labels: ["เผยแพร่", "ฉบับร่าง (ยังไม่แสดงในเว็บ)"] },
      { name: "published_at", label: "วันที่เผยแพร่", type: "date", defaultValue: today(), hint: "ตั้งเป็นวันในอนาคตเพื่อตั้งเวลา — ข่าวจะขึ้นเว็บเมื่อถึงวันนั้น" },
      { name: "body", label: "เนื้อหา", type: "textarea" },
      { name: "image_url", label: "ลิงก์รูปภาพประกอบ", type: "url", hint: "หรืออัปโหลดรูปด้านล่างแทน" },
      { name: "image_file", label: "อัปโหลดรูปภาพ (JPG/PNG)", type: "file", uploadTo: "image_url", accept: "image/*" },
      { name: "link_url", label: "ลิงก์ที่เกี่ยวข้อง", type: "url", hint: "เช่น ไฟล์ประกาศบน Google Drive" },
    ],
  },
  {
    table: "documents", label: "คลังเอกสาร", icon: "📄",
    order: { col: "updated_at", asc: false },
    columns: ["title", "category", "academic_year", "visibility"],
    fields: [
      { name: "title", label: "ชื่อเอกสาร", type: "text", required: true },
      { name: "category", label: "หมวดหมู่", type: "select", options: DOC_CATEGORIES },
      { name: "academic_year", label: "ปีการศึกษา (พ.ศ.)", type: "text", hint: "เช่น 2569" },
      { name: "visibility", label: "ผู้ที่เห็นเอกสาร", type: "select", options: ["public", "teacher"], hint: "public = ทุกคน · teacher = เฉพาะครูที่ล็อกอิน" },
      { name: "description", label: "คำอธิบายสั้น ๆ", type: "text" },
      { name: "file_url", label: "ลิงก์ไฟล์ (Google Drive ฯลฯ)", type: "url", hint: "หรืออัปโหลดไฟล์ด้านล่างแทน" },
      { name: "file", label: "อัปโหลดไฟล์ (PDF/Word/Excel ≤ 10MB)", type: "file", uploadTo: "file_url", accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg" },
    ],
  },
  {
    table: "events", label: "ปฏิทิน", icon: "📅",
    order: { col: "start_date", asc: true },
    columns: ["title", "category", "start_date", "end_date"],
    fields: [
      { name: "title", label: "กิจกรรม", type: "text", required: true },
      { name: "category", label: "ประเภท", type: "select", options: ["กิจกรรมวิชาการ", "วัดผล", "ครู", "นิเทศ", "ลงทะเบียน", "การรับสมัครนักเรียน", "ภาคเรียน"] },
      { name: "start_date", label: "วันที่เริ่ม", type: "date", required: true },
      { name: "end_date", label: "วันที่สิ้นสุด", type: "date", hint: "ไม่บังคับ" },
      { name: "description", label: "รายละเอียด", type: "textarea" },
    ],
  },
  {
    table: "services", label: "ระบบบริการออนไลน์", icon: "💻",
    order: { col: "sort_order", asc: true },
    columns: ["icon", "title", "audience", "sort_order"],
    fields: [
      { name: "title", label: "ชื่อบริการ", type: "text", required: true },
      { name: "url", label: "ลิงก์", type: "url", required: true },
      { name: "description", label: "คำอธิบาย", type: "text" },
      { name: "icon", label: "ไอคอน (emoji)", type: "text", defaultValue: "🔗" },
      { name: "audience", label: "ผู้ใช้", type: "select", options: ["public", "teacher"] },
      { name: "sort_order", label: "ลำดับ (น้อยขึ้นก่อน)", type: "number", defaultValue: "100" },
    ],
  },
  {
    table: "achievements", label: "ผลงาน/นวัตกรรม", icon: "🏆",
    order: { col: "created_at", asc: false },
    columns: ["title", "kind", "owner_name", "academic_year"],
    fields: [
      { name: "title", label: "ชื่อผลงาน", type: "text", required: true },
      { name: "kind", label: "ประเภท", type: "select", options: ["ผลงานนักเรียน", "ผลงานครู", "นวัตกรรมการจัดการเรียนรู้", "วิจัยในชั้นเรียน", "Best Practice", "การแข่งขันทางวิชาการ", "โครงงานวิทยาศาสตร์", "STEM Education", "ผลงานห้องเรียนพิเศษ", "รางวัล"] },
      { name: "owner_name", label: "ชื่อผู้จัดทำ", type: "text" },
      { name: "academic_year", label: "ปีการศึกษา", type: "text" },
      { name: "description", label: "รายละเอียด", type: "textarea" },
      { name: "image_url", label: "ลิงก์รูปภาพ", type: "url" },
      { name: "image_file", label: "อัปโหลดรูปภาพ", type: "file", uploadTo: "image_url", accept: "image/*" },
      { name: "link_url", label: "ลิงก์ไฟล์/รายละเอียด", type: "url" },
    ],
  },
  {
    table: "tasks", label: "งานที่ครูต้องส่ง", icon: "✅",
    order: { col: "due_date", asc: true },
    columns: ["title", "category", "due_date"],
    fields: [
      { name: "title", label: "ชื่องาน/เอกสารที่ต้องส่ง", type: "text", required: true },
      { name: "category", label: "หมวด", type: "select", options: ["การสอน", "วัดผล", "ทะเบียน", "หลักสูตร", "ประกันคุณภาพ", "อื่น ๆ"] },
      { name: "due_date", label: "กำหนดส่ง", type: "date", required: true },
      { name: "description", label: "รายละเอียด/ช่องทางส่ง", type: "textarea" },
    ],
  },
  {
    table: "timetable", label: "ตารางสอน", icon: "🗓️",
    order: { col: "class_name", asc: true },
    columns: ["class_name", "day", "period", "subject", "teacher_name", "room"],
    fields: [
      { name: "class_name", label: "ชั้น/ห้อง", type: "text", required: true, hint: "เช่น ม.6/2" },
      { name: "day", label: "วัน (1=จันทร์ … 5=ศุกร์)", type: "number", required: true },
      { name: "period", label: "คาบที่ (1–8)", type: "number", required: true },
      { name: "subject", label: "วิชา", type: "text", required: true },
      { name: "teacher_name", label: "ครูผู้สอน", type: "text" },
      { name: "room", label: "ห้องเรียน", type: "text" },
    ],
  },
  {
    table: "class_notices", label: "ประกาศห้องเรียน/ผลสอบ", icon: "🏫",
    order: { col: "created_at", asc: false },
    columns: ["class_name", "kind", "title"],
    fields: [
      { name: "class_name", label: "ชั้น/ห้อง", type: "text", required: true, hint: "เช่น ม.6/2 หรือ ทุกห้อง" },
      { name: "kind", label: "ประเภท", type: "select", options: ["ประกาศ", "ผลสอบ", "รายชื่อห้อง", "ตารางสอบ"] },
      { name: "title", label: "หัวข้อ", type: "text", required: true },
      { name: "body", label: "รายละเอียด", type: "textarea" },
      { name: "link_url", label: "ลิงก์ไฟล์", type: "url" },
    ],
  },
  {
    table: "student_results", label: "ผลสอบรายบุคคล", icon: "🔎", adminOnly: true,
    order: { col: "created_at", asc: false },
    columns: ["student_code", "student_name", "exam_name", "score", "grade"],
    fields: [
      { name: "student_code", label: "รหัสนักเรียน", type: "text", required: true },
      { name: "pin", label: "รหัสผ่านตรวจผล (PIN)", type: "text", required: true, hint: "แนะนำ 6 หลักขึ้นไป แจ้งนักเรียนเป็นรายบุคคล" },
      { name: "student_name", label: "ชื่อ-สกุล", type: "text", required: true },
      { name: "exam_name", label: "รายการสอบ/วิชา", type: "text", required: true },
      { name: "score", label: "คะแนน", type: "text" },
      { name: "grade", label: "ผลการเรียน", type: "text" },
      { name: "note", label: "หมายเหตุ", type: "text" },
    ],
  },
];

export const findTable = (t: string) => adminTables.find((x) => x.table === t);
