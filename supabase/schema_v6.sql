-- v6: ข้อมูลกลุ่มสาระ/อีเมลของผู้ใช้ + ผู้รับผิดชอบคำร้อง + แจ้งเตือนทางอีเมล — รันต่อจาก schema_v5.sql

-- 1) โปรไฟล์ผู้ใช้: กลุ่มสาระการเรียนรู้ และอีเมลสำหรับรับแจ้งเตือน (ไม่บังคับ)
--    หมายเหตุ: profiles.email ของบัญชีเลขบัตรเป็นอีเมลภายในแบบแฮช จึงต้องมีคอลัมน์แยก
alter table public.profiles add column if not exists learning_area text;
alter table public.profiles add column if not exists contact_email text;

-- 2) กติกามอบหมายผู้รับผิดชอบ: (ประเภทคำร้อง, ระดับชั้น) -> ครู   level '*' = ทุกระดับ (ใช้เมื่อไม่มีกติกาเฉพาะระดับ)
create table if not exists public.request_assignees (
  id uuid primary key default gen_random_uuid(),
  request_type text not null,
  level text not null default '*',
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (request_type, level)
);
alter table public.request_assignees enable row level security;
drop policy if exists "request_assignees editor read" on public.request_assignees;
create policy "request_assignees editor read" on public.request_assignees for select using (public.is_editor());
drop policy if exists "request_assignees admin write" on public.request_assignees;
create policy "request_assignees admin write" on public.request_assignees for all
  using (public.current_role_name() = 'admin') with check (public.current_role_name() = 'admin');

-- 3) คำร้อง: ระดับชั้น + ผู้รับผิดชอบ + สถานะการแจ้งเตือนอีเมล
alter table public.requests add column if not exists level text;
alter table public.requests add column if not exists assignee_id uuid references public.profiles(id) on delete set null;
alter table public.requests add column if not exists assignee_name text;
alter table public.requests add column if not exists notified_at timestamptz;
alter table public.requests add column if not exists notify_error text;

-- ผู้เยี่ยมชมยื่นคำร้องได้ แต่ห้ามกำหนดผู้รับผิดชอบ/สถานะแจ้งเตือนเอง (ระบบฝั่งเซิร์ฟเวอร์เป็นผู้กำหนด)
drop policy if exists "requests anyone insert" on public.requests;
create policy "requests anyone insert" on public.requests for insert
  with check (status = 'รอดำเนินการ' and assignee_id is null and assignee_name is null and notified_at is null and notify_error is null);
