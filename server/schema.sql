-- Run this in Supabase Dashboard → SQL Editor to create the attendance table
-- used by server/routes/attendance.js.

create table if not exists public.attendance (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  time_in       time,
  time_out      time,
  selfie_in_path  text,
  selfie_out_path text,
  location_in   text,
  location_out  text,
  total_hours   numeric(5,2),
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_attendance_user_id on public.attendance (user_id);
create index if not exists idx_attendance_date on public.attendance (date);
create index if not exists idx_attendance_status on public.attendance (status);
create unique index if not exists idx_attendance_user_date on public.attendance (user_id, date);

alter table public.attendance enable row level security;

-- Users can read/insert/update their own attendance rows.
create policy "attendance_select_own" on public.attendance
  for select using (auth.uid() = user_id);

create policy "attendance_insert_own" on public.attendance
  for insert with check (auth.uid() = user_id);

create policy "attendance_update_own" on public.attendance
  for update using (auth.uid() = user_id);

-- Owner/manager roles (set via user metadata role = 'owner' | 'manager')
-- can read and update all rows.
create policy "attendance_select_manager" on public.attendance
  for select using (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('owner','manager')
    or (auth.jwt() -> 'user_metadata' ->> 'role') in ('owner','manager')
  );

create policy "attendance_update_manager" on public.attendance
  for update using (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('owner','manager')
    or (auth.jwt() -> 'user_metadata' ->> 'role') in ('owner','manager')
  );
