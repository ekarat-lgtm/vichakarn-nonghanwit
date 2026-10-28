-- v3: บัญชีครูที่ล็อกอินด้วยเลขบัตรประชาชน (รันต่อจาก schema.sql และ schema_v2.sql)
-- เลขบัตรไม่ถูกเก็บในฐานข้อมูล: ระบบแปลงเป็นค่าแฮช (HMAC) ใช้แทนอีเมลภายใน
-- id_hint เก็บเฉพาะ 4 หลักท้าย เพื่อให้แอดมินแยกแยะบัญชีได้

alter table public.profiles add column if not exists must_change_password boolean not null default false;
alter table public.profiles add column if not exists id_hint text;

-- ให้ผู้ใช้ปลดธงบังคับเปลี่ยนรหัสของ "ตัวเอง" เท่านั้น (หลังเปลี่ยนรหัสสำเร็จ)
create or replace function public.clear_must_change_password()
returns void language sql security definer set search_path = public as $$
  update public.profiles set must_change_password = false where id = auth.uid();
$$;
revoke all on function public.clear_must_change_password() from public, anon;
grant execute on function public.clear_must_change_password() to authenticated;
