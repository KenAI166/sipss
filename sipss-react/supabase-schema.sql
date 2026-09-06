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
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Migration for existing sales tables (safe to run more than once):
alter table public.sales add column if not exists deleted_at timestamptz;

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
  recipe_id bigint not null references public.recipes(id) on delete cascade,
  ingredient_id bigint not null references public.ingredients(id),
  quantity numeric not null,
  unit text default 'pcs',
  notes text
);

-- Migration for existing recipe_items tables (adds the foreign keys PostgREST
-- needs to embed ingredients(...) in select queries). Safe to run more than once.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'recipe_items_recipe_id_fkey') then
    alter table public.recipe_items
      add constraint recipe_items_recipe_id_fkey
      foreign key (recipe_id) references public.recipes(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'recipe_items_ingredient_id_fkey') then
    alter table public.recipe_items
      add constraint recipe_items_ingredient_id_fkey
      foreign key (ingredient_id) references public.ingredients(id);
  end if;
end $$;

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

-- ---------------------------------------------------------------------------
-- One-round-trip checkout
--
-- process_sale() performs an entire POS order in a single Postgres
-- transaction: inserts the sale, deducts recipe ingredient stock (validating
-- every ingredient first), writes stock_transactions rows, and decrements
-- product stock. Previously the client did all of this as ~10+ sequential
-- PostgREST requests per cart item, which made checkout take seconds.
--
-- Any error (e.g. insufficient stock) raises an exception and the WHOLE
-- transaction rolls back — no partial sales, no half-deducted stock.
--
-- p_sale:  jsonb with receipt_number, items (json string), subtotal, tax,
--          discount, total, payment_method, customer_name, notes,
--          cashier_name, created_at
-- p_items: jsonb array of { "product_id": <bigint>, "quantity": <number> }
-- ---------------------------------------------------------------------------

create or replace function public.process_sale(p_sale jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id bigint;
  v_item jsonb;
  v_rec record;
  v_ri record;
  v_deduct numeric;
  v_new numeric;
begin
  insert into public.sales (
    receipt_number, items, subtotal, tax, discount, total,
    payment_method, customer_name, notes, cashier_name, created_at
  ) values (
    p_sale->>'receipt_number',
    p_sale->>'items',
    (p_sale->>'subtotal')::numeric,
    (p_sale->>'tax')::numeric,
    coalesce((p_sale->>'discount')::numeric, 0),
    (p_sale->>'total')::numeric,
    p_sale->>'payment_method',
    p_sale->>'customer_name',
    p_sale->>'notes',
    p_sale->>'cashier_name',
    coalesce((p_sale->>'created_at')::timestamptz, now())
  ) returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    -- Decrement sellable product stock.
    update public.products
       set stock = coalesce(stock, 0) - (v_item->>'quantity')::numeric
     where id = (v_item->>'product_id')::bigint;

    -- Deduct recipe ingredients (one recipe per product, matching the
    -- client's getRecipeByProductId behavior).
    for v_rec in
      select * from public.recipes
       where product_id = (v_item->>'product_id')::bigint
       order by id
       limit 1
    loop
      for v_ri in
        select ri.ingredient_id, ri.quantity as recipe_quantity,
               i.name, i.unit, i.current_quantity, i.cost_per_unit
          from public.recipe_items ri
          join public.ingredients i on i.id = ri.ingredient_id
         where ri.recipe_id = v_rec.id
      loop
        v_deduct := v_ri.recipe_quantity
                  * ((v_item->>'quantity')::numeric / coalesce(v_rec.yield_quantity, 1));
        v_new := coalesce(v_ri.current_quantity, 0) - v_deduct;
        if v_new < 0 then
          raise exception 'Insufficient stock for %: need % %, have %',
            v_ri.name, v_deduct, v_ri.unit, v_ri.current_quantity;
        end if;

        update public.ingredients
           set current_quantity = v_new
         where id = v_ri.ingredient_id;

        insert into public.stock_transactions (
          ingredient_id, ingredient_name, transaction_type, quantity,
          quantity_before, quantity_after, reference_id, reference_type,
          reason, cost_per_unit, total_cost, created_by
        ) values (
          v_ri.ingredient_id, v_ri.name, 'sale', -v_deduct,
          v_ri.current_quantity, v_new, p_sale->>'receipt_number', 'sale',
          'Sold ' || (v_item->>'quantity') || ' x ' || v_rec.product_name,
          coalesce(v_ri.cost_per_unit, 0),
          v_deduct * coalesce(v_ri.cost_per_unit, 0),
          p_sale->>'cashier_name'
        );
      end loop;
    end loop;
  end loop;

  return jsonb_build_object(
    'sale_id', v_sale_id,
    'receipt_number', p_sale->>'receipt_number'
  );
end $$;

grant execute on function public.process_sale(jsonb, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- One-round-trip stock adjustment
--
-- adjust_stock() replaces 3 sequential client calls (fetch ingredient, update
-- quantity, insert stock_transaction) with a single atomic transaction.
-- ---------------------------------------------------------------------------

create or replace function public.adjust_stock(
  p_ingredient_id bigint,
  p_quantity_change numeric,
  p_transaction_type text,
  p_reference_id text,
  p_reference_type text,
  p_reason text,
  p_created_by text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ing public.ingredients%rowtype;
  v_new numeric;
begin
  select * into v_ing from public.ingredients where id = p_ingredient_id for update;
  if not found then
    raise exception 'Ingredient not found';
  end if;

  v_new := coalesce(v_ing.current_quantity, 0) + p_quantity_change;

  update public.ingredients
     set current_quantity = v_new
   where id = p_ingredient_id
   returning * into v_ing;

  insert into public.stock_transactions (
    ingredient_id, ingredient_name, transaction_type, quantity,
    quantity_before, quantity_after, reference_id, reference_type,
    reason, cost_per_unit, total_cost, created_by
  ) values (
    p_ingredient_id, v_ing.name, p_transaction_type, p_quantity_change,
    coalesce(v_ing.current_quantity, 0) - p_quantity_change, v_ing.current_quantity,
    p_reference_id, p_reference_type, p_reason,
    coalesce(v_ing.cost_per_unit, 0),
    abs(p_quantity_change) * coalesce(v_ing.cost_per_unit, 0),
    p_created_by
  );

  return to_jsonb(v_ing);
end $$;

grant execute on function public.adjust_stock(bigint, numeric, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- One-round-trip attendance save
--
-- upsert_attendance() replaces the client's find-then-update/insert pair
-- (2 calls) with a single call: updates by id, or by (staff_id, date) when no
-- id is provided, otherwise inserts. Returns the saved row.
-- ---------------------------------------------------------------------------

create or replace function public.upsert_attendance(p_record jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
  v_row public.attendance%rowtype;
begin
  v_id := nullif(p_record->>'id', '')::bigint;

  -- No id: reuse the existing record for this staff/date if one exists,
  -- matching the client-side dedupe behavior.
  if v_id is null and (p_record ? 'staff_id') and (p_record ? 'date') then
    select id into v_id
      from public.attendance
     where staff_id = (p_record->>'staff_id')::bigint
       and date = p_record->>'date'
     order by created_at desc
     limit 1;
  end if;

  if v_id is not null then
    update public.attendance set
      staff_id       = (p_record->>'staff_id')::bigint,
      staff_name     = p_record->>'staff_name',
      date           = p_record->>'date',
      time_in        = p_record->>'time_in',
      break_start    = p_record->>'break_start',
      break_end      = p_record->>'break_end',
      time_out       = p_record->>'time_out',
      overtime_start = p_record->>'overtime_start',
      overtime_end   = p_record->>'overtime_end',
      notes          = p_record->>'notes'
    where id = v_id
    returning * into v_row;
  else
    insert into public.attendance (
      staff_id, staff_name, date, time_in, break_start, break_end,
      time_out, overtime_start, overtime_end, notes, created_at
    ) values (
      (p_record->>'staff_id')::bigint,
      p_record->>'staff_name',
      p_record->>'date',
      p_record->>'time_in',
      p_record->>'break_start',
      p_record->>'break_end',
      p_record->>'time_out',
      p_record->>'overtime_start',
      p_record->>'overtime_end',
      p_record->>'notes',
      coalesce((p_record->>'created_at')::timestamptz, now())
    ) returning * into v_row;
  end if;

  return to_jsonb(v_row);
end $$;

grant execute on function public.upsert_attendance(jsonb) to anon, authenticated;
