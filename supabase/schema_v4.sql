-- v4: ประวัติการแก้ไขคำร้อง (ใครแก้ เมื่อไร เปลี่ยนอะไร) — รันต่อจาก schema_v3.sql
-- บันทึกแบบ "เพิ่มอย่างเดียว" (ไม่มี policy แก้ไข/ลบ) และชื่อผู้แก้ถูกกำหนดโดยฐานข้อมูลจากบัญชีที่ล็อกอิน จึงปลอมไม่ได้

create table if not exists public.request_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.requests(id) on delete set null,
  request_code text not null,
  editor_id uuid references public.profiles(id) on delete set null,
  editor_name text not null,
  editor_role text,
  from_status text,
  to_status text,
  from_response text,
  to_response text,
  created_at timestamptz not null default now()
);
create index if not exists request_logs_req_idx on public.request_logs (request_id, created_at desc);
create index if not exists request_logs_time_idx on public.request_logs (created_at desc);

create or replace function public.request_logs_stamp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.editor_id := auth.uid();
  new.editor_name := coalesce((select full_name from public.profiles where id = auth.uid()), new.editor_name, 'ไม่ทราบ');
  new.editor_role := public.current_role_name();
  new.created_at := now();
  return new;
end;
$$;
drop trigger if exists request_logs_stamp on public.request_logs;
create trigger request_logs_stamp before insert on public.request_logs
  for each row execute function public.request_logs_stamp();

alter table public.request_logs enable row level security;
drop policy if exists "request_logs editor read" on public.request_logs;
create policy "request_logs editor read" on public.request_logs for select using (public.is_editor());
drop policy if exists "request_logs editor insert" on public.request_logs;
create policy "request_logs editor insert" on public.request_logs for insert with check (public.is_editor());
