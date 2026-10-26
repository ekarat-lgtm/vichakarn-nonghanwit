import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
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

/** เก็บแคชข้อมูลสาธารณะ 60 วินาที (ล้างทันทีเมื่อแอดมินบันทึก ผ่านแท็ก "content") */
const cached = <A extends unknown[], R>(key: string, fn: (...a: A) => Promise<R>) =>
  unstable_cache(fn, [key], { revalidate: 60, tags: ["content"] });

/** เรียกซ้ำใน request เดียวกัน (Header/Footer/หน้า) จะคิวรีครั้งเดียว */
export const getSession = cache(async (): Promise<{ email: string | null; role: Role }> => {
  const sb = await createClient();
  if (!sb) return { email: null, role: "anon" };
  const { data } = await sb.auth.getUser();
  if (!data.user) return { email: null, role: "anon" };
  const { data: p } = await sb.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  return { email: data.user.email ?? null, role: (p?.role as Role) ?? "guest" };
});

export const isStaff = (r: Role) => r === "teacher" || r === "editor" || r === "admin";
export const isEditor = (r: Role) => r === "editor" || r === "admin";

type Client = NonNullable<ReturnType<typeof createPublicClient>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function listWith<T>(sb: Client | null, table: string, build: (q: any) => any): Promise<T[]> {
  if (!sb) return [];
  const { data, error } = await build(sb.from(table).select("*"));
  if (error) return [];
  return (data ?? []) as T[];
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listPublic = <T,>(table: string, build: (q: any) => any) => listWith<T>(createPublicClient(), table, build);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function listAsUser<T>(table: string, build: (q: any) => any): Promise<T[]> {
  const sb = await createClient();
  return listWith<T>(sb as Client | null, table, build);
}

const settingsPublic = cached("settings", async (): Promise<Record<string, string>> => {
  const sb = createPublicClient();
  const out: Record<string, string> = {};
  if (!sb) return out;
  const { data } = await sb.from("settings").select("key,value");
  (data ?? []).forEach((r) => { if (r.value) out[r.key] = r.value; });
  return out;
});

export async function getSettings(): Promise<Record<string, string>> {
  const base: Record<string, string> = {
    academic_head: school.deputies[0],
    academic_head_title: "รองผู้อำนวยการกลุ่มบริหารวิชาการ",
    academic_email: process.env.NEXT_PUBLIC_ACADEMIC_EMAIL ?? "",
    current_year: "2569",
    current_semester: "2",
  };
  return { ...base, ...(await settingsPublic()) };
}

const newsCached = cached("news", (limit: number, category?: string) =>
  listPublic<News>("news", (q) => {
    let x = q.eq("published", true).order("published_at", { ascending: false }).limit(limit);
    if (category) x = x.eq("category", category);
    return x;
  }));
export const getNews = (limit = 50, category?: string) => newsCached(limit, category);

const newsItemCached = cached("news-item", async (id: string): Promise<News | null> => {
  const sb = createPublicClient();
  if (!sb) return null;
  const { data } = await sb.from("news").select("*").eq("id", id).eq("published", true).maybeSingle();
  return (data as News) ?? null;
});
export async function getNewsItem(id: string): Promise<News | null> {
  const hit = await newsItemCached(id);
  if (hit) return hit;
  // ข่าวที่ยังไม่เผยแพร่ — ให้ editor/admin เปิดดูได้ผ่านสิทธิ์ของผู้ใช้
  const sb = await createClient();
  if (!sb) return null;
  const { data } = await sb.from("news").select("*").eq("id", id).maybeSingle();
  return (data as News) ?? null;
}

type DocOpts = { categories?: string[]; q?: string; year?: string; limit?: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const docQuery = (opts: DocOpts, publicOnly: boolean) => (q: any) => {
  let x = q.order("updated_at", { ascending: false }).limit(opts.limit ?? 200);
  if (publicOnly) x = x.eq("visibility", "public");
  if (opts.categories?.length) x = x.in("category", opts.categories);
  if (opts.year) x = x.eq("academic_year", opts.year);
  if (opts.q) x = x.ilike("title", `%${opts.q.replace(/[%,]/g, " ")}%`);
  return x;
};
const docsPublic = cached("docs-public", (opts: DocOpts) => listPublic<Doc>("documents", docQuery(opts, true)));
export async function getDocs(opts: DocOpts = {}): Promise<Doc[]> {
  const { role } = await getSession();
  return isStaff(role) ? listAsUser<Doc>("documents", docQuery(opts, false)) : docsPublic(opts);
}

const eventsCached = cached("events", (upcomingOnly: boolean, limit: number) =>
  listPublic<EventRow>("events", (q) => {
    let x = q.order("start_date", { ascending: true }).limit(limit);
    if (upcomingOnly) x = x.gte("start_date", new Date().toISOString().slice(0, 10));
    return x;
  }));
export const getEvents = (upcomingOnly = false, limit = 100) => eventsCached(upcomingOnly, limit);

const servicesPublic = cached("services-public", () =>
  listPublic<Service>("services", (q) => q.eq("audience", "public").order("sort_order", { ascending: true })));
export async function getServices(): Promise<Service[]> {
  const { role } = await getSession();
  return isStaff(role)
    ? listAsUser<Service>("services", (q) => q.order("sort_order", { ascending: true }))
    : servicesPublic();
}

const achievementsCached = cached("achievements", (limit: number) =>
  listPublic<Achievement>("achievements", (q) => q.order("created_at", { ascending: false }).limit(limit)));
export const getAchievements = (limit = 100) => achievementsCached(limit);
