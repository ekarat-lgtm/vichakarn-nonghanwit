-- =====================================================================
-- เว็บไซต์งานวิชาการ โรงเรียนหนองหานวิทยา — Supabase schema
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางทั้งไฟล์ → Run
-- (ใช้โปรเจกต์ Supabase ที่สร้างด้วยอีเมลของฝ่ายวิชาการ)
-- =====================================================================

-- ---------- ตาราง ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'guest' check (role in ('guest','teacher','editor','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'ข่าวประชาสัมพันธ์',
  body text,
  image_url text,
  link_url text,
  published boolean not null default true,
  published_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'อื่น ๆ',
  academic_year text,
  description text,
  file_url text not null,
  visibility text not null default 'public' check (visibility in ('public','teacher')),
  updated_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'กิจกรรมวิชาการ',
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text not null,
  icon text default '🔗',
  audience text not null default 'public' check (audience in ('public','teacher')),
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null default 'ผลงานนักเรียน',
  owner_name text,
  academic_year text,
  description text,
  image_url text,
  link_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

create index if not exists documents_cat_idx on public.documents (category, academic_year);
create index if not exists news_pub_idx on public.news (published, published_at desc);
create index if not exists events_start_idx on public.events (start_date);

-- ---------- ฟังก์ชันตรวจสิทธิ์ ----------
create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'anon');
$$;

create or replace function public.is_staff()      -- ครู/บรรณาธิการ/แอดมิน
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_name() in ('teacher','editor','admin');
$$;

create or replace function public.is_editor()     -- ผู้ดูแลเนื้อหา
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_name() in ('editor','admin');
$$;

-- ---------- สร้างโปรไฟล์อัตโนมัติเมื่อมีผู้ใช้ใหม่ ----------
-- อีเมลโดเมน @nonghanwit.ac.th จะได้สิทธิ์ครู (teacher) อัตโนมัติ
-- อีเมลอื่น (เช่น อีเมลกลางของฝ่ายวิชาการที่ใช้สมัคร) เริ่มต้นเป็น guest แล้วแอดมินปรับสิทธิ์ทีหลัง
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when lower(new.email) like '%@nonghanwit.ac.th' then 'teacher' else 'guest' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ----------
alter table public.profiles     enable row level security;
alter table public.news         enable row level security;
alter table public.documents    enable row level security;
alter table public.events       enable row level security;
alter table public.services     enable row level security;
alter table public.achievements enable row level security;
alter table public.settings     enable row level security;

-- profiles
drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles for select
  using (id = auth.uid() or public.current_role_name() = 'admin');
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles for update
  using (public.current_role_name() = 'admin');

-- news
drop policy if exists "news public read" on public.news;
create policy "news public read" on public.news for select
  using (published or public.is_editor());
drop policy if exists "news editor write" on public.news;
create policy "news editor write" on public.news for all
  using (public.is_editor()) with check (public.is_editor());

-- documents (visibility = teacher เห็นเฉพาะผู้ที่ล็อกอินเป็นครูขึ้นไป)
drop policy if exists "documents read" on public.documents;
create policy "documents read" on public.documents for select
  using (visibility = 'public' or public.is_staff());
drop policy if exists "documents editor write" on public.documents;
create policy "documents editor write" on public.documents for all
  using (public.is_editor()) with check (public.is_editor());

-- events
drop policy if exists "events public read" on public.events;
create policy "events public read" on public.events for select using (true);
drop policy if exists "events editor write" on public.events;
create policy "events editor write" on public.events for all
  using (public.is_editor()) with check (public.is_editor());

-- services
drop policy if exists "services read" on public.services;
create policy "services read" on public.services for select
  using (audience = 'public' or public.is_staff());
drop policy if exists "services editor write" on public.services;
create policy "services editor write" on public.services for all
  using (public.is_editor()) with check (public.is_editor());

-- achievements
drop policy if exists "achievements public read" on public.achievements;
create policy "achievements public read" on public.achievements for select using (true);
drop policy if exists "achievements editor write" on public.achievements;
create policy "achievements editor write" on public.achievements for all
  using (public.is_editor()) with check (public.is_editor());

-- settings
drop policy if exists "settings public read" on public.settings;
create policy "settings public read" on public.settings for select using (true);
drop policy if exists "settings editor write" on public.settings;
create policy "settings editor write" on public.settings for all
  using (public.is_editor()) with check (public.is_editor());

-- ---------- Storage (อัปโหลดไฟล์เอกสาร) ----------
-- หมายเหตุ: bucket นี้เป็น public (ใครมีลิงก์ก็ดาวน์โหลดได้)
-- เอกสารที่ละเอียดอ่อนจริง ๆ แนะนำให้ใช้ลิงก์ Google Drive ที่จำกัดสิทธิ์เฉพาะบัญชี @nonghanwit.ac.th
insert into storage.buckets (id, name, public)
values ('academic-docs', 'academic-docs', true)
on conflict (id) do nothing;

drop policy if exists "academic-docs public read" on storage.objects;
create policy "academic-docs public read" on storage.objects for select
  using (bucket_id = 'academic-docs');
drop policy if exists "academic-docs editor insert" on storage.objects;
create policy "academic-docs editor insert" on storage.objects for insert
  with check (bucket_id = 'academic-docs' and public.is_editor());
drop policy if exists "academic-docs editor delete" on storage.objects;
create policy "academic-docs editor delete" on storage.objects for delete
  using (bucket_id = 'academic-docs' and public.is_editor());

-- =====================================================================
-- ข้อมูลเริ่มต้น (ดึงจากเว็บไซต์ของโรงเรียน) — แก้ไข/เพิ่มได้ที่ /admin
-- =====================================================================

-- ข้อมูลโรงเรียน (ค่าว่าง = ยังไม่มีข้อมูล ให้ไปเติมที่ /admin/settings)
insert into public.settings (key, value) values
  ('academic_head',  'นางสาวศุภกานต์ นาสมฝัน'),
  ('academic_head_title', 'รองผู้อำนวยการกลุ่มบริหารวิชาการ'),
  ('academic_phone', ''),
  ('academic_email', ''),
  ('academic_line',  ''),
  ('academic_facebook', ''),
  ('calendar_embed_url', ''),
  ('current_year', '2569'),
  ('current_semester', '2')
on conflict (key) do nothing;

-- ระบบบริการออนไลน์ (ลิงก์จริงจากเว็บโรงเรียน)
insert into public.services (title, description, url, icon, audience, sort_order) values
  ('ดูผลการเรียน Online', 'สำหรับนักเรียนและผู้ปกครอง (ระบบ SGS สพฐ.)', 'https://sgs6.bopp-obec.info/sgss/security/signin.aspx', '📊', 'public', 10),
  ('จัดการผลการเรียน Online', 'สำหรับครูผู้สอน บันทึก/ส่งผลการเรียน', 'https://sgs.bopp-obec.info/menu/tblNews/ShowTblNewsTable.aspx', '📝', 'teacher', 20),
  ('ระบบการเงิน น.ว.', 'ระบบงานการเงินโรงเรียนหนองหานวิทยา', 'https://sites.google.com/nonghanwit.ac.th/money', '💰', 'public', 30),
  ('ตรวจสอบการชำระเงินบำรุงการศึกษา', 'ตรวจสอบสถานะการชำระเงิน', 'https://nw.udmoney.com/', '🧾', 'public', 40),
  ('ระบบดูแลช่วยเหลือนักเรียน', 'เข้าระบบดูแลช่วยเหลือนักเรียน', 'http://118.175.157.18/studentsys', '🤝', 'teacher', 50),
  ('ภาพกิจกรรมโรงเรียน', 'คลังภาพกิจกรรม (Google Drive)', 'https://drive.google.com/drive/folders/1UzO0U0uhOdchbS5KB-RlYK0CC_2bfvAc', '🖼️', 'public', 60),
  ('คำสั่งโรงเรียน', 'คำสั่งโรงเรียน (Google Drive)', 'https://drive.google.com/drive/folders/1G9lahhT74VTXEDXFpJfSPmJHTlvEUtDJ', '📑', 'teacher', 70),
  ('เว็บไซต์หลักโรงเรียน', 'ข่าวสาร ข้อมูลพื้นฐาน ITA', 'https://nonghan.thai.ac/home/', '🏫', 'public', 80),
  ('Google Sites โรงเรียน', 'NonghanWittaya School', 'https://sites.google.com/nonghanwit.ac.th/nonghanwittaya-school/home', '🌐', 'public', 90),
  ('สพม.อุดรธานี (เขต 20)', 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษา เขต 20', 'http://www.sesa20.go.th/', '🏛️', 'public', 100)
on conflict do nothing;

-- รายงาน SAR และแผนพัฒนาคุณภาพ (ลิงก์จริงจากเว็บโรงเรียน)
insert into public.documents (title, category, academic_year, description, file_url, visibility) values
  ('รายงานการประเมินตนเอง (SAR) ปีการศึกษา 2567', 'ประกันคุณภาพ', '2567', 'SAR โรงเรียนหนองหานวิทยา', 'https://drive.google.com/file/d/1C0Enw1Zq88cYt77UT2fiHSK4EoW8HsJC/view', 'public'),
  ('รายงานการประเมินตนเอง (SAR) ปีการศึกษา 2566', 'ประกันคุณภาพ', '2566', 'SAR โรงเรียนหนองหานวิทยา', 'https://drive.google.com/file/d/1vGUPDw-T_jZnsCuOR-Y7I6xfX34SCV3I/view', 'public'),
  ('รายงานการประเมินตนเอง (SAR) ปีการศึกษา 2565', 'ประกันคุณภาพ', '2565', 'SAR โรงเรียนหนองหานวิทยา', 'https://drive.google.com/file/d/1Ax83fxp5Wd0XGGAY-YhANJ0b0Y8896W3/view', 'public'),
  ('รายงานการประเมินตนเอง (SAR) ปีการศึกษา 2564', 'ประกันคุณภาพ', '2564', 'SAR โรงเรียนหนองหานวิทยา', 'https://drive.google.com/file/d/1v0yRhbsE8gGa9BSEPfJGPJqjpd2tr6Nm/view', 'public'),
  ('รายงานการประเมินตนเอง (SAR) ปีการศึกษา 2563', 'ประกันคุณภาพ', '2563', 'SAR โรงเรียนหนองหานวิทยา', 'https://drive.google.com/file/d/1FNfrBo671L4hz0_psGCCJ59OPo__6Uot/view', 'public'),
  ('แผนพัฒนาคุณภาพการศึกษา', 'ประกันคุณภาพ', null, 'แผนพัฒนาคุณภาพการศึกษาของสถานศึกษา', 'https://drive.google.com/file/d/1T3j7wZUbdnDJ06tcRr1NPyS_-5mh-u8W/view', 'public');

-- ปฏิทินตัวอย่าง (แก้ไขเป็นวันที่จริงที่ /admin/events)
insert into public.events (title, description, category, start_date, end_date) values
  ('ตัวอย่าง: กำหนดส่งแผนการจัดการเรียนรู้', 'แก้ไขวันที่จริงที่หน้าแอดมิน', 'ครู', current_date + 7, null),
  ('ตัวอย่าง: สอบกลางภาค', 'แก้ไขวันที่จริงที่หน้าแอดมิน', 'วัดผล', current_date + 21, current_date + 25);

-- ข่าวจากเว็บโรงเรียน
insert into public.news (title, category, body, link_url, published_at) values
  ('โรงเรียนหนองหานวิทยาประกาศรับสมัครครูชาวต่างชาติ', 'ข่าวสารสำหรับครูและบุคลากร', 'ประกาศรับสมัครครูชาวต่างชาติ (ลูกจ้างชั่วคราว) — ดูรายละเอียดที่เว็บไซต์โรงเรียน', 'https://nonghan.thai.ac/home/all-news/', '2026-04-07'),
  ('ประกาศรายชื่อผู้ผ่านการคัดเลือกเป็นลูกจ้างชั่วคราว ครูชาวต่างชาติ', 'ข่าวสารสำหรับครูและบุคลากร', 'ดูรายละเอียดที่เว็บไซต์โรงเรียน', 'https://nonghan.thai.ac/home/all-news/', '2026-07-09'),
  ('เปิดรับสมัครนักเรียน ม.1 และ ม.4 ปีการศึกษา 2568', 'ข่าวการรับสมัครนักเรียน', 'รับสมัครวันที่ 20–24 มีนาคม 2568 ณ อาคารเจ้าปู่หอคำ โรงเรียนหนองหานวิทยา', 'https://sites.google.com/nonghanwit.ac.th/nonghanwittaya-school/ประกาศจากโรงเรยน', '2025-03-01');
