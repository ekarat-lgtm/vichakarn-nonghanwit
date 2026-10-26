import { DOC_CATEGORIES, NEWS_CATEGORIES } from "@/lib/sections";

export type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "url" | "file" | "number";
  required?: boolean;
  options?: string[];
  hint?: string;
  defaultValue?: string;
};

export type TableCfg = {
  table: string;
  label: string;
  icon: string;
  fields: Field[];
  columns: string[]; // คอลัมน์ที่แสดงในตาราง
  order: { col: string; asc: boolean };
};

const today = () => new Date().toISOString().slice(0, 10);

export const adminTables: TableCfg[] = [
  {
    table: "news", label: "ข่าวประชาสัมพันธ์", icon: "📢",
    order: { col: "published_at", asc: false },
    columns: ["title", "category", "published_at"],
    fields: [
      { name: "title", label: "หัวข้อข่าว", type: "text", required: true },
      { name: "category", label: "หมวดข่าว", type: "select", options: NEWS_CATEGORIES },
      { name: "published_at", label: "วันที่เผยแพร่", type: "date", defaultValue: today() },
      { name: "body", label: "เนื้อหา", type: "textarea" },
      { name: "image_url", label: "ลิงก์รูปภาพประกอบ", type: "url", hint: "ไม่บังคับ" },
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
      { name: "file", label: "อัปโหลดไฟล์ (PDF/Word/Excel ≤ 10MB)", type: "file" },
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
      { name: "link_url", label: "ลิงก์ไฟล์/รายละเอียด", type: "url" },
    ],
  },
];

export const findTable = (t: string) => adminTables.find((x) => x.table === t);
