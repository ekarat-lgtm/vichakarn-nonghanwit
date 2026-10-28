/* ค่าคงที่ของฟอร์มแจ้งส่งงาน (เก็บเฉพาะข้อมูลแจ้งส่งในฐานข้อมูล — ไฟล์อยู่ใน Google Drive) */
export const LEARNING_AREAS = [
  "ภาษาไทย", "คณิตศาสตร์", "วิทยาศาสตร์และเทคโนโลยี", "สังคมศึกษา ศาสนา และวัฒนธรรม",
  "สุขศึกษาและพลศึกษา", "ศิลปะ", "การงานอาชีพ", "ภาษาต่างประเทศ", "กิจกรรมพัฒนาผู้เรียน", "อื่น ๆ",
];
export const LEVELS = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];
export const MAX_FILE_MB = 100;
export const MAX_FILES = 5;
export const ALLOWED_EXT = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "jpeg", "png", "zip", "txt", "csv"];

export type SubmittedFile = { id?: string; name: string; size?: number; url?: string | null };
export type Submission = {
  id: string; user_id: string; teacher_name: string; learning_area: string; subject: string; levels: string;
  task_label: string; task_url: string; academic_year: string | null; semester: string | null;
  note: string | null; files: SubmittedFile[]; created_at: string;
};
export const fileExt = (n: string) => (n.split(".").pop() ?? "").toLowerCase();
