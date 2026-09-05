-- SIPSS Supabase schema
-- Run this in Supabase Dashboard -> SQL Editor.
-- Mirrors src/utils/database.ts (sql.js) so the React app can use Supabase
-- instead of browser-local storage.
--
-- NOTE: drops the `attendance` table created by server/schema.sql (it had a
-- different user_id-based shape). If it already contains data you need,
-- export it first.
drop table if exists public.attendance cascade;

create table public.products (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null,
  price numeric not null,
  cost_price numeric default 0,
  stock integer default 0,
  sku text,
  is_active boolean default true,
  description text,
  barcode text,
  color text default '#22C55E',
  shape text,
  created_at timestamptz not null default now()
);

create table public.sales (
  id bigint generated always as identity primary key,
  receipt_number text not null,
  items text not null,
  subtotal numeric not null,
  tax numeric not null,
  discount numeric default 0,
  total numeric not null,
  payment_method text not null,
  customer_name text,
  notes text,
  cashier_name text,
  created_at timestamptz not null default now()
);

create table public.attendance (
  id bigint generated always as identity primary key,
  staff_id bigint not null,
  staff_name text not null,
  date text not null,
  time_in text,
  break_start text,
  break_end text,
  time_out text,
  overtime_start text,
  overtime_end text,
  notes text,
  created_at timestamptz not null default now()
);
create index idx_attendance_staff_date on public.attendance (staff_id, date);

create table public.staff (
  id bigint generated always as identity primary key,
  name text not null,
  age integer,
  position text,
  contact_number text,
  qr_code text unique,
  hourly_rate numeric default 0,
  created_at timestamptz not null default now()
);

create table public.payroll (
  id bigint generated always as identity primary key,
  staff_id bigint not null,
  staff_name text not null,
  period_start text not null,
  period_end text not null,
  total_hours numeric default 0,
  total_break_hours numeric default 0,
  net_hours numeric default 0,
  gross_pay numeric default 0,
  deductions numeric default 0,
  late_deductions numeric default 0,
  days_present integer default 0,
  days_absent integer default 0,
  days_late integer default 0,
  net_pay numeric default 0,
  status text default 'pending',
  deleted_at text,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id bigint generated always as identity primary key,
  description text not null,
  amount numeric not null,
  category text not null,
  date text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.inventory (
  id bigint generated always as identity primary key,
  product_id bigint not null,
  product_name text not null,
  current_quantity integer not null,
  minimum_quantity integer default 10,
  unit text default 'pcs',
  last_updated text not null,
  stock_type text default 'kitchen',
  category text default 'general',
  created_at timestamptz not null default now()
);

create table public.ingredients (
  id bigint generated always as identity primary key,
  name text not null,
  category text default 'general',
  unit text default 'pcs',
  current_quantity numeric default 0,
  minimum_quantity numeric default 10,
  reorder_quantity numeric default 0,
  cost_per_unit numeric default 0,
  supplier_id bigint,
  expiry_date text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.recipes (
  id bigint generated always as identity primary key,
  product_id bigint not null,
  product_name text not null,
  yield_quantity integer default 1,
  notes text,
  created_at timestamptz not null default now()
);

create table public.recipe_items (
  id bigint generated always as identity primary key,
  recipe_id bigint not null,
  ingredient_id bigint not null,
  quantity numeric not null,
  unit text default 'pcs',
  notes text
);

create table public.suppliers (
  id bigint generated always as identity primary key,
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  payment_terms text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.stock_transactions (
  id bigint generated always as identity primary key,
  ingredient_id bigint,
  ingredient_name text,
  transaction_type text not null,
  quantity numeric not null,
  quantity_before numeric not null,
  quantity_after numeric not null,
  reference_id text,
  reference_type text,
  reason text,
  cost_per_unit numeric default 0,
  total_cost numeric default 0,
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create table public.schedules (
  id bigint generated always as identity primary key,
  staff_id bigint not null,
  staff_name text not null,
  date text not null,
  shift_start text not null,
  shift_end text not null,
  notes text
);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- The app connects with the publishable (anon) key and has NO Supabase Auth
-- login yet, so the policies below allow full read/write to anyone holding
-- the publishable key. That key is embedded in the public website bundle,
-- which means this data is effectively public. Treat this as a temporary
-- setup: once Supabase Auth login is wired in, replace these with per-user
-- policies.
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'products','sales','attendance','staff','payroll','expenses','inventory',
    'ingredients','recipes','recipe_items','suppliers','stock_transactions','schedules'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all using (true) with check (true)', t || '_anon_all', t);
  end loop;
end $$;
