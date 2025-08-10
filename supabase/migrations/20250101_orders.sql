-- Orders schema for Stripe-based checkout
-- Run with Supabase migrations

create extension if not exists pgcrypto;

-- Addresses
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  name text not null,
  address text not null,
  address2 text null,
  city text not null,
  region text not null,
  postal text not null,
  country text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  email text not null,
  address_id uuid references public.addresses(id) on delete set null,
  currency text not null default 'USD',
  subtotal_cents integer not null default 0,
  is_paid boolean not null default false,
  paid_at timestamptz null,
  status text not null default 'pending',
  stripe_session_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order Items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid null,
  variant_id uuid null,
  name text not null,
  size text null,
  color text null,
  qty integer not null check (qty > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  currency text not null default 'USD',
  image_path text null
);

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();

-- RLS
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Helper: detect admin via JWT claim `role` == 'admin'
create or replace function public.is_admin()
returns boolean as $$
  select coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin', false);
$$ language sql stable;

-- Addresses policies
drop policy if exists addresses_owner_rw on public.addresses;
create policy addresses_owner_rw on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists addresses_admin_list on public.addresses;
create policy addresses_admin_list on public.addresses
  for select using (public.is_admin());

-- Orders policies
drop policy if exists orders_owner_rw on public.orders;
create policy orders_owner_rw on public.orders
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists orders_admin_list on public.orders;
create policy orders_admin_list on public.orders
  for select using (public.is_admin());

-- Allow service role (stripe-webhook) to update is_paid regardless of RLS (service role bypasses RLS, but explicit policy for clarity)
drop policy if exists orders_service_update_paid on public.orders;
create policy orders_service_update_paid on public.orders
  for update using (true) with check (true);

-- Order Items policies
drop policy if exists order_items_owner_rw on public.order_items;
create policy order_items_owner_rw on public.order_items
  for all using (
    exists (
      select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists order_items_admin_list on public.order_items;
create policy order_items_admin_list on public.order_items
  for select using (public.is_admin());


