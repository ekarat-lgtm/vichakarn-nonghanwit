import { createClient } from "@/lib/supabase/server";
import { school } from "@/lib/school";

export type News = {
  id: string; title: string; category: string; body: string | null;
  image_url: string | null; link_url: string | null; published: boolean; published_at: string;
};
export type Doc = {
  id: string; title: string; category: string; academic_year: string | null;
  description: string | null; file_url: string; visibility: "public" | "teacher"; updated_at: string;
};
export type EventRow = {
  id: string; title: string; description: string | null; category: string;
  start_date: string; end_date: string | null;
};
export type Service = {
  id: string; title: string; description: string | null; url: string; icon: string | null;
  audience: "public" | "teacher"; sort_order: number;
};
export type Achievement = {
  id: string; title: string; kind: string; owner_name: string | null; academic_year: string | null;
  description: string | null; image_url: string | null; link_url: string | null;
};
export type Role = "anon" | "guest" | "teacher" | "editor" | "admin";

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "";

export async function getSession(): Promise<{ email: string | null; role: Role }> {
  const sb = await createClient();
  if (!sb) return { email: null, role: "anon" };
  const { data } = await sb.auth.getUser();
  if (!data.user) return { email: null, role: "anon" };
  const { data: p } = await sb.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  return { email: data.user.email ?? null, role: (p?.role as Role) ?? "guest" };
}

export const isStaff = (r: Role) => r === "teacher" || r === "editor" || r === "admin";
export const isEditor = (r: Role) => r === "editor" || r === "admin";

export async function getSettings(): Promise<Record<string, string>> {
  const base: Record<string, string> = {
    academic_head: school.deputies[0],
    academic_head_title: "รองผู้อำนวยการกลุ่มบริหารวิชาการ",
    academic_email: process.env.NEXT_PUBLIC_ACADEMIC_EMAIL ?? "",
    current_year: "2569",
    current_semester: "2",
  };
  const sb = await createClient();
  if (!sb) return base;
  const { data } = await sb.from("settings").select("key,value");
  (data ?? []).forEach((r) => {
    if (r.value) base[r.key] = r.value;
  });
  return base;
}

async function list<T>(table: string, build: (q: any) => any): Promise<T[]> {
  const sb = await createClient();
  if (!sb) return [];
  const { data, error } = await build(sb.from(table).select("*"));
  if (error) return [];
  return (data ?? []) as T[];
}

export const getNews = (limit = 50, category?: string) =>
  list<News>("news", (q) => {
    let x = q.eq("published", true).order("published_at", { ascending: false }).limit(limit);
    if (category) x = x.eq("category", category);
    return x;
  });

export async function getNewsItem(id: string): Promise<News | null> {
  const sb = await createClient();
  if (!sb) return null;
  const { data } = await sb.from("news").select("*").eq("id", id).maybeSingle();
  return (data as News) ?? null;
}

export const getDocs = (opts: { categories?: string[]; q?: string; year?: string; limit?: number } = {}) =>
  list<Doc>("documents", (q) => {
    let x = q.order("updated_at", { ascending: false }).limit(opts.limit ?? 200);
    if (opts.categories?.length) x = x.in("category", opts.categories);
    if (opts.year) x = x.eq("academic_year", opts.year);
    if (opts.q) x = x.ilike("title", `%${opts.q.replace(/[%,]/g, " ")}%`);
    return x;
  });

export const getEvents = (upcomingOnly = false, limit = 100) =>
  list<EventRow>("events", (q) => {
    let x = q.order("start_date", { ascending: true }).limit(limit);
    if (upcomingOnly) x = x.gte("start_date", new Date().toISOString().slice(0, 10));
    return x;
  });

export const getServices = () =>
  list<Service>("services", (q) => q.order("sort_order", { ascending: true }));

export const getAchievements = (limit = 100) =>
  list<Achievement>("achievements", (q) => q.order("created_at", { ascending: false }).limit(limit));
