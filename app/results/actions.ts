"use server";

import { hasSupabase } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { demoRows } from "@/lib/store";

export type ResultRow = { student_name: string; exam_name: string; score: string | null; grade: string | null; note: string | null };
export type LookupState = { rows?: ResultRow[]; error?: string; code?: string };

// กันการเดา PIN: ผิดเกิน 5 ครั้ง/10 นาที ต่อรหัสนักเรียน จะถูกล็อกชั่วคราว (ในหน่วยความจำของเซิร์ฟเวอร์)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fails: Map<string, number[]> = ((globalThis as any).__nwFails ??= new Map());

export async function lookupResults(_prev: LookupState, fd: FormData): Promise<LookupState> {
  const code = String(fd.get("code") ?? "").trim().slice(0, 30);
  const pin = String(fd.get("pin") ?? "").trim().slice(0, 30);
  if (!code || !pin) return { error: "กรุณากรอกรหัสนักเรียนและ PIN", code };

  const now = Date.now();
  const recent = (fails.get(code) ?? []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= 5) return { error: "กรอกผิดหลายครั้ง กรุณารอสักครู่แล้วลองใหม่ หรือติดต่องานทะเบียน", code };

  let rows: ResultRow[] = [];
  if (!hasSupabase) {
    rows = demoRows("student_results").filter((r) => r.student_code === code && r.pin === pin) as ResultRow[];
  } else {
    const sb = createPublicClient();
    if (!sb) return { error: "ระบบยังไม่พร้อมใช้งาน" };
    const { data } = await sb.rpc("lookup_results", { p_code: code, p_pin: pin });
    rows = (data as ResultRow[] | null) ?? [];
  }
  if (!rows.length) {
    fails.set(code, [...recent, now]);
    return { error: "ไม่พบข้อมูล — ตรวจสอบรหัสนักเรียนและ PIN อีกครั้ง", code };
  }
  fails.delete(code);
  return { rows };
}
