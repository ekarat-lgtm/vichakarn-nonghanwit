import { dbSelect, type Row } from "@/lib/db";
import { todayTH } from "@/lib/store";

export const daysLeft = (due: string) =>
  Math.round((Date.parse(String(due).slice(0, 10)) - Date.parse(todayTH())) / 864e5);

export type DueState = "overdue" | "soon" | "ok";
export const dueState = (due: string): DueState => {
  const d = daysLeft(due);
  return d < 0 ? "overdue" : d <= 7 ? "soon" : "ok";
};
export const dueLabel = (due: string) => {
  const d = daysLeft(due);
  return d < 0 ? `เลยกำหนด ${-d} วัน` : d === 0 ? "ครบกำหนดวันนี้" : `อีก ${d} วัน`;
};

export async function loadTracking() {
  const [tasks, profiles, subs] = await Promise.all([
    dbSelect("tasks", { order: { col: "due_date", asc: true } }),
    dbSelect("profiles", { order: { col: "full_name", asc: true } }),
    dbSelect("submissions"),
  ]);
  const teachers = profiles.filter((p: Row) => p.role !== "guest");
  const has = (taskId: string, teacherId: string) => subs.find((s: Row) => s.task_id === taskId && s.teacher_id === teacherId);
  return { tasks, teachers, subs, has };
}
