import { cache } from "react";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { createClient, hasSupabase } from "@/lib/supabase/server";
import { DEMO_USERS, demoRows, todayTH, type Row } from "@/lib/store";
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
export type Slot = { id: string; class_name: string; day: number; period: number; subject: string; teacher_name: string | null; room: string | null };
export type Notice = { id: string; class_name: string; title: string; body: string | null; kind: string; link_url: string | null; created_at: string };
export type Session = { email: string | null; role: Role; name: string | null; uid: string | null };

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "";

/** เก็บแคชข้อมูลสาธารณะ 60 วินาที (ล้างทันทีเมื่อแอดมินบันทึก ผ่านแท็ก "content") */
const cached = <A extends unknown[], R>(key: string, fn: (...a: A) => Promise<R>) =>
  unstable_cache(fn, [key], { revalidate: 60, tags: ["content"] });

/** เรียกซ้ำใน request เดียวกัน (Header/Footer/หน้า) จะคิวรีครั้งเดียว */
export const getSession = cache(async (): Promise<Session> => {
  if (!hasSupabase) {
    // โหมดเดโม: เลือกสิทธิ์ได้จากแถบด้านบนของเว็บ (เก็บในคุกกี้ demo_role)
    const r = ((await cookies()).get("demo_role")?.value ?? "admin") as keyof typeof DEMO_USERS | "anon";
    if (r === "anon" || !(r in DEMO_USERS)) return { email: null, role: "anon", name: null, uid: null };
    const u = DEMO_USERS[r];
    return { email: u.email, role: r, name: u.name, uid: u.uid };
  }
  const sb = await createClient();
  if (!sb) return { email: null, role: "anon", name: null, uid: null };
  const { data } = await sb.auth.getUser();
  if (!data.user) return { email: null, role: "anon", name: null, uid: null };
  const { data: p } = await sb.from("profiles").select("role,full_name").eq("id", data.user.id).maybeSingle();
  return { email: data.user.email ?? null, role: (p?.role as Role) ?? "guest", name: p?.full_name ?? data.user.email ?? null, uid: data.user.id };
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
  if (!hasSupabase) {
    const out: Record<string, string> = {};
    demoRows("settings").forEach((r) => { if (r.value) out[r.key] = r.value; });
    return { ...base, ...out };
  }
  return { ...base, ...(await settingsPublic()) };
}

const newsCached = cached("news", (limit: number, category?: string) =>
  listPublic<News>("news", (q) => {
    let x = q.eq("published", true).lte("published_at", todayTH()).order("published_at", { ascending: false }).limit(limit);
    if (category) x = x.eq("category", category);
    return x;
  }));
export const getNews = async (limit = 50, category?: string): Promise<News[]> => {
  if (!hasSupabase) {
    return demoRows("news")
      .filter((n) => n.published && n.published_at <= todayTH() && (!category || n.category === category))
      .sort((a, b) => (a.published_at < b.published_at ? 1 : -1))
      .slice(0, limit) as News[];
  }
  return newsCached(limit, category);
};

const newsItemCached = cached("news-item", async (id: string): Promise<News | null> => {
  const sb = createPublicClient();
  if (!sb) return null;
  const { data } = await sb.from("news").select("*").eq("id", id).eq("published", true).lte("published_at", todayTH()).maybeSingle();
  return (data as News) ?? null;
});
export async function getNewsItem(id: string): Promise<News | null> {
  if (!hasSupabase) {
    const r = demoRows("news").find((x) => x.id === id) as News | undefined;
    if (!r) return null;
    const visible = r.published && r.published_at <= todayTH();
    return visible || isEditor((await getSession()).role) ? r : null;
  }
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
  if (!hasSupabase) {
    return demoRows("documents")
      .filter((d) => (isStaff(role) || d.visibility === "public")
        && (!opts.categories?.length || opts.categories.includes(d.category))
        && (!opts.year || d.academic_year === opts.year)
        && (!opts.q || String(d.title).toLowerCase().includes(opts.q.toLowerCase())))
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
      .slice(0, opts.limit ?? 200) as Doc[];
  }
  return isStaff(role) ? listAsUser<Doc>("documents", docQuery(opts, false)) : docsPublic(opts);
}

const eventsCached = cached("events", (upcomingOnly: boolean, limit: number) =>
  listPublic<EventRow>("events", (q) => {
    let x = q.order("start_date", { ascending: true }).limit(limit);
    if (upcomingOnly) x = x.gte("start_date", new Date().toISOString().slice(0, 10));
    return x;
  }));
export const getEvents = async (upcomingOnly = false, limit = 100): Promise<EventRow[]> => {
  if (!hasSupabase) {
    return demoRows("events")
      .filter((e) => !upcomingOnly || e.start_date >= todayTH())
      .sort((a, b) => (a.start_date > b.start_date ? 1 : -1))
      .slice(0, limit) as EventRow[];
  }
  return eventsCached(upcomingOnly, limit);
};

const servicesPublic = cached("services-public", () =>
  listPublic<Service>("services", (q) => q.eq("audience", "public").order("sort_order", { ascending: true })));
export async function getServices(): Promise<Service[]> {
  const { role } = await getSession();
  if (!hasSupabase) {
    return demoRows("services")
      .filter((x) => isStaff(role) || x.audience === "public")
      .sort((a, b) => a.sort_order - b.sort_order) as Service[];
  }
  return isStaff(role)
    ? listAsUser<Service>("services", (q) => q.order("sort_order", { ascending: true }))
    : servicesPublic();
}

const achievementsCached = cached("achievements", (limit: number) =>
  listPublic<Achievement>("achievements", (q) => q.order("created_at", { ascending: false }).limit(limit)));
export const getAchievements = async (limit = 100): Promise<Achievement[]> =>
  !hasSupabase
    ? (demoRows("achievements").sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, limit) as Achievement[])
    : achievementsCached(limit);

const timetableCached = cached("timetable", () =>
  listPublic<Slot>("timetable", (q) => q.order("day").order("period")));
export const getTimetable = async (): Promise<Slot[]> =>
  !hasSupabase ? (demoRows("timetable") as Slot[]) : timetableCached();

const noticesCached = cached("notices", () =>
  listPublic<Notice>("class_notices", (q) => q.order("created_at", { ascending: false }).limit(200)));
export const getNotices = async (): Promise<Notice[]> =>
  !hasSupabase
    ? (demoRows("class_notices").sort((a, b) => (a.created_at < b.created_at ? 1 : -1)) as Notice[])
    : noticesCached();

export type { Row };
