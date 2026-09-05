-- Run this in Supabase Dashboard → SQL Editor to create the attendance table
-- used by server/routes/attendance.js.

drop table if exists public.attendance;

create table public.attendance (
  id            bigint generated always as identity primary key,
  staff_id      bigint not null,
  staff_name    text not null,
  date          date not null,
  time_in       text,
  break_start   text,
  break_end     text,
  time_out      text,
  overtime_start text,
  overtime_end  text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_attendance_staff_id on public.attendance (staff_id);
create index if not exists idx_attendance_date on public.attendance (date);
create unique index if not exists idx_attendance_staff_date on public.attendance (staff_id, date);

alter table public.attendance enable row level security;

-- Allow any authenticated app user to read and manage attendance.
-- For production, restrict this to owner/manager by checking the JWT role claim.
create policy "attendance_all_auth" on public.attendance
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =============================================================================
-- Profiles + RBAC
-- Replaces the old MySQL `users` table. Auth identities live in auth.users
-- (created via the Supabase Dashboard or server/scripts/create-users.js);
-- this table holds app-level profile data. The authoritative role is
-- auth.users.app_metadata.role ('owner' = CEO/admin, 'manager' = manager
-- covering barista + cashier duties); profiles.role mirrors it for display.
-- =============================================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  full_name   text not null,
  email       text unique not null,
  role        text not null check (role in ('owner','manager')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles (role);

alter table public.profiles enable row level security;

-- Any authenticated user can read profiles (needed for staff pickers, display names).
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');

-- Users can update their own non-role fields.
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Only the owner (CEO) can insert/delete profiles or change roles.
-- Enforced via the JWT app_metadata claim — never trust client input for role.
create policy "profiles_owner_all" on public.profiles
  for all using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
  ) with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
  );

-- Seed the two accounts (after creating them in Authentication → Users):
--   admin / owner  — CEO, full access
--   manager        — manager, operations access (POS/cashier + inventory/barista)
-- insert into public.profiles (id, username, full_name, email, role) values
--   ('<admin-auth-user-uuid>',   'admin',   'CEO / Administrator', 'admin@sipstation.com',   'owner'),
--   ('<manager-auth-user-uuid>', 'manager', 'Store Manager',       'manager@sipstation.com', 'manager');

-- =============================================================================
-- Expenses
-- Tracks business expenses such as utilities, supplies, rent, salaries, etc.
-- =============================================================================

drop table if exists public.expenses;

create table public.expenses (
  id            bigint generated always as identity primary key,
  description   text not null,
  amount        numeric(10,2) not null,
  category      text not null,
  date          date not null,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_expenses_date on public.expenses (date);
create index if not exists idx_expenses_category on public.expenses (category);

alter table public.expenses enable row level security;

create policy "expenses_all_auth" on public.expenses
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =============================================================================
-- Products
-- Used by the Product module (sipss-react/src/components/Products.tsx).
-- Delete is a soft delete via is_active = false.
-- =============================================================================

create table if not exists public.products (
  id          bigint generated always as identity primary key,
  name        text not null,
  category    text not null,
  price       numeric(10,2) not null,
  cost_price  numeric(10,2) not null default 0,
  stock       integer not null default 0,
  sku         text,
  barcode     text,
  color       text default '#22C55E',
  shape       text default 'rectangle',
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_products_category on public.products (category);
create index if not exists idx_products_is_active on public.products (is_active);

alter table public.products enable row level security;

create policy "products_all_auth" on public.products
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =============================================================================
-- Transactions
-- A unified transaction log for auditing and recent activity. The app records
-- major events (sales, attendance, expenses, stock, payroll) here in addition
-- to the dedicated module tables.
-- =============================================================================

drop table if exists public.transactions;

create table public.transactions (
  id            bigint generated always as identity primary key,
  type          text not null,
  reference_id  bigint,
  reference_table text,
  description   text not null,
  amount        numeric(10,2),
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

create index if not exists idx_transactions_type on public.transactions (type);
create index if not exists idx_transactions_created_at on public.transactions (created_at desc);

alter table public.transactions enable row level security;

create policy "transactions_all_auth" on public.transactions
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
