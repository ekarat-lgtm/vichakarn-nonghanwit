-- v5: ข้อมูลแจ้งส่งงานของครู (เก็บเฉพาะข้อความ — ไฟล์จริงอยู่ใน Google Drive) — รันต่อจาก schema_v4.sql
create table if not exists public.work_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  teacher_name text not null,
  learning_area text not null,
  subject text not null,
  levels text not null,
  task_label text not null,
  task_url text not null,
  academic_year text,
  semester text,
  note text,
  files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists work_submissions_user_idx on public.work_submissions (user_id, created_at desc);
create index if not exists work_submissions_task_idx on public.work_submissions (task_url, academic_year, semester);

alter table public.work_submissions enable row level security;
drop policy if exists "work_submissions own read" on public.work_submissions;
create policy "work_submissions own read" on public.work_submissions for select using (user_id = auth.uid() or public.is_editor());
drop policy if exists "work_submissions staff insert" on public.work_submissions;
create policy "work_submissions staff insert" on public.work_submissions for insert
  with check (user_id = auth.uid() and public.current_role_name() in ('teacher', 'editor', 'admin'));
drop policy if exists "work_submissions editor delete" on public.work_submissions;
create policy "work_submissions editor delete" on public.work_submissions for delete using (public.is_editor());
