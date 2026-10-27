-- =====================================================================
-- ส่วนเพิ่มเติม (v2): คำร้อง · ติดตามการส่งงานครู · ตารางสอน · ประกาศห้อง/ผลสอบ
-- รันต่อจาก schema.sql ใน Supabase → SQL Editor (รันซ้ำได้)
-- =====================================================================

-- ตั้งเวลาเผยแพร่ข่าว: ข่าวที่วันเผยแพร่ยังไม่ถึง จะไม่ปรากฏต่อผู้เยี่ยมชม
drop policy if exists "news public read" on public.news;
create policy "news public read" on public.news for select
  using ((published and published_at <= current_date) or public.is_editor());

-- ให้ editor/admin เห็นรายชื่อผู้ใช้ (ใช้ในหน้าติดตามการส่งงาน)
drop policy if exists "profiles editor read" on public.profiles;
create policy "profiles editor read" on public.profiles for select using (public.is_editor());

-- ---------- ตาราง ----------
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null,
  requester_name text not null,
  class_name text,
  contact text,
  detail text,
  status text not null default 'รอดำเนินการ',
  response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  due_date date not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  teacher_name text,
  submitted_at timestamptz not null default now(),
  unique (task_id, teacher_id)
);

create table if not exists public.timetable (
  id uuid primary key default gen_random_uuid(),
  class_name text not null,
  day int not null check (day between 1 and 5),
  period int not null check (period between 1 and 10),
  subject text not null,
  teacher_name text,
  room text,
  created_at timestamptz not null default now()
);

create table if not exists public.class_notices (
  id uuid primary key default gen_random_uuid(),
  class_name text not null,
  title text not null,
  body text,
  kind text not null default 'ประกาศ',
  link_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.student_results (
  id uuid primary key default gen_random_uuid(),
  student_code text not null,
  pin text not null,
  student_name text,
  exam_name text not null,
  score text,
  grade text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists student_results_code_idx on public.student_results (student_code);

-- ---------- Row Level Security ----------
alter table public.requests        enable row level security;
alter table public.tasks           enable row level security;
alter table public.submissions     enable row level security;
alter table public.timetable       enable row level security;
alter table public.class_notices   enable row level security;
alter table public.student_results enable row level security;

-- คำร้อง: ใครก็ยื่นได้ แต่อ่าน/แก้ได้เฉพาะ editor (ผู้ยื่นตรวจสถานะผ่านฟังก์ชัน track_request)
drop policy if exists "requests anyone insert" on public.requests;
create policy "requests anyone insert" on public.requests for insert with check (status = 'รอดำเนินการ');
drop policy if exists "requests editor all" on public.requests;
create policy "requests editor all" on public.requests for all using (public.is_editor()) with check (public.is_editor());

-- งานที่ครูต้องส่ง
drop policy if exists "tasks staff read" on public.tasks;
create policy "tasks staff read" on public.tasks for select using (public.is_staff());
drop policy if exists "tasks editor write" on public.tasks;
create policy "tasks editor write" on public.tasks for all using (public.is_editor()) with check (public.is_editor());

-- การส่งงาน: ครูเห็น/สร้าง/ยกเลิกของตัวเอง · editor จัดการได้ทุกคน
drop policy if exists "submissions own read" on public.submissions;
create policy "submissions own read" on public.submissions for select using (teacher_id = auth.uid() or public.is_editor());
drop policy if exists "submissions own insert" on public.submissions;
create policy "submissions own insert" on public.submissions for insert with check (teacher_id = auth.uid() and public.is_staff());
drop policy if exists "submissions own delete" on public.submissions;
create policy "submissions own delete" on public.submissions for delete using (teacher_id = auth.uid());
drop policy if exists "submissions editor write" on public.submissions;
create policy "submissions editor write" on public.submissions for all using (public.is_editor()) with check (public.is_editor());

-- ตารางสอน / ประกาศห้อง: ทุกคนอ่านได้ editor เขียนได้
drop policy if exists "timetable public read" on public.timetable;
create policy "timetable public read" on public.timetable for select using (true);
drop policy if exists "timetable editor write" on public.timetable;
create policy "timetable editor write" on public.timetable for all using (public.is_editor()) with check (public.is_editor());

drop policy if exists "class_notices public read" on public.class_notices;
create policy "class_notices public read" on public.class_notices for select using (true);
drop policy if exists "class_notices editor write" on public.class_notices;
create policy "class_notices editor write" on public.class_notices for all using (public.is_editor()) with check (public.is_editor());

-- ผลสอบรายบุคคล: ไม่เปิดอ่านตรง ๆ (admin เท่านั้น) — นักเรียนตรวจผ่านฟังก์ชัน lookup_results
drop policy if exists "student_results admin all" on public.student_results;
create policy "student_results admin all" on public.student_results for all
  using (public.current_role_name() = 'admin') with check (public.current_role_name() = 'admin');

-- ---------- ฟังก์ชันสำหรับผู้เยี่ยมชม (ไม่เปิดข้อมูลส่วนตัว) ----------
create or replace function public.track_request(p_code text)
returns table (code text, type text, status text, response text, created_at timestamptz, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select r.code, r.type, r.status, r.response, r.created_at, r.updated_at
  from public.requests r where r.code = upper(trim(p_code)) limit 1;
$$;
grant execute on function public.track_request(text) to anon, authenticated;

create or replace function public.lookup_results(p_code text, p_pin text)
returns table (student_name text, exam_name text, score text, grade text, note text)
language sql security definer set search_path = public as $$
  select s.student_name, s.exam_name, s.score, s.grade, s.note
  from public.student_results s
  where s.student_code = trim(p_code) and s.pin = trim(p_pin)
  order by s.created_at desc;
$$;
grant execute on function public.lookup_results(text, text) to anon, authenticated;
-- หมายเหตุความปลอดภัย: ใช้ PIN ที่เดายาก (6 หลักขึ้นไป) และแจ้งนักเรียนเป็นรายบุคคล
