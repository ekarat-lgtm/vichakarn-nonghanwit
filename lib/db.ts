/* ชั้นอ่าน/เขียนข้อมูลแบบรวมศูนย์: ใช้ Supabase เมื่อตั้งค่าแล้ว ไม่งั้นใช้ข้อมูลตัวอย่างในหน่วยความจำ (โหมดเดโม) */
import { createClient, hasSupabase } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { demo, newId, type Row } from "@/lib/store";

export type { Row };
export type Q = { eq?: Record<string, unknown>; order?: { col: string; asc?: boolean }; limit?: number };

export async function dbSelect<T = Row>(table: string, q: Q = {}): Promise<T[]> {
  if (!hasSupabase) {
    let rows = [...(demo()[table] ?? [])];
    for (const [k, v] of Object.entries(q.eq ?? {})) rows = rows.filter((r) => r[k] === v);
    if (q.order) {
      const { col, asc = true } = q.order;
      rows.sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
    }
    return rows.slice(0, q.limit ?? 1000) as T[];
  }
  const sb = await createClient();
  if (!sb) return [];
  let x = sb.from(table).select("*");
  for (const [k, v] of Object.entries(q.eq ?? {})) x = x.eq(k, v as never);
  if (q.order) x = x.order(q.order.col, { ascending: q.order.asc ?? true });
  const { data } = await x.limit(q.limit ?? 1000);
  return (data ?? []) as T[];
}

export type Result = { error?: string; row?: Row };

/** asPublic = true: เขียนด้วยสิทธิ์ผู้เยี่ยมชม (เช่น ยื่นคำร้อง) */
export async function dbInsert(table: string, row: Row, asPublic = false): Promise<Result> {
  if (!hasSupabase) {
    const now = new Date().toISOString();
    const r = { id: newId(), created_at: now, ...(table === "documents" ? { updated_at: now.slice(0, 10) } : {}), ...row };
    (demo()[table] ??= []).unshift(r);
    return { row: r };
  }
  const sb = asPublic ? createPublicClient() : await createClient();
  if (!sb) return { error: "ยังไม่ได้ตั้งค่า Supabase" };
  const { error } = await sb.from(table).insert(row);
  return error ? { error: error.message } : { row };
}

export async function dbUpdate(table: string, id: string, patch: Row): Promise<Result> {
  if (!hasSupabase) {
    const r = (demo()[table] ?? []).find((x) => x.id === id);
    if (!r) return { error: "ไม่พบรายการ" };
    Object.assign(r, patch);
    return { row: r };
  }
  const sb = await createClient();
  if (!sb) return { error: "ยังไม่ได้ตั้งค่า Supabase" };
  const { error } = await sb.from(table).update(patch).eq("id", id);
  return error ? { error: error.message } : {};
}

export async function dbDelete(table: string, id: string): Promise<Result> {
  if (!hasSupabase) {
    const rows = (demo()[table] ??= []);
    const i = rows.findIndex((x) => x.id === id);
    if (i >= 0) rows.splice(i, 1);
    return {};
  }
  const sb = await createClient();
  if (!sb) return { error: "ยังไม่ได้ตั้งค่า Supabase" };
  const { error } = await sb.from(table).delete().eq("id", id);
  return error ? { error: error.message } : {};
}

/** บันทึก/แทนที่ตามคีย์ (ใช้กับตาราง settings) */
export async function dbUpsert(table: string, rows: Row[], key: string): Promise<Result> {
  if (!hasSupabase) {
    const list = (demo()[table] ??= []);
    for (const r of rows) {
      const i = list.findIndex((x) => x[key] === r[key]);
      if (i >= 0) list[i] = { ...list[i], ...r }; else list.push(r);
    }
    return {};
  }
  const sb = await createClient();
  if (!sb) return { error: "ยังไม่ได้ตั้งค่า Supabase" };
  const { error } = await sb.from(table).upsert(rows);
  return error ? { error: error.message } : {};
}
