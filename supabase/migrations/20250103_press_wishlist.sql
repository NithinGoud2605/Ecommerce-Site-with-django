-- Press and Wishlist schema

-- Helper exists from earlier: public.is_admin()

-- Press table
create table if not exists public.press (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  kind text not null check (kind in ('runway','press','editorial')),
  hero_path text null,
  video_url text null,
  article_url text null,
  excerpt text null,
  published_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table public.press enable row level security;

drop policy if exists press_public_read on public.press;
create policy press_public_read on public.press
  for select using (published_at is not null and published_at <= now());

drop policy if exists press_admin_write on public.press;
create policy press_admin_write on public.press
  for all using (public.is_admin()) with check (public.is_admin());

-- Wishlists table
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id text not null,
  variant_id text null,
  created_at timestamptz not null default now()
);

alter table public.wishlists enable row level security;

-- Unique per user/product/variant
create unique index if not exists wishlists_unique on public.wishlists (user_id, product_id, coalesce(variant_id, ''));

drop policy if exists wishlists_owner_rw on public.wishlists;
create policy wishlists_owner_rw on public.wishlists
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Storage: add press-media bucket to public read/admin write list
-- Policies were created earlier; create additional allow entries if needed
-- Note: if storage policies are bucket-scoped in previous migration, ensure 'press-media' is included


