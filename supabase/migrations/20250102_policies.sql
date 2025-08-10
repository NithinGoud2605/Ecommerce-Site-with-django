-- Strict RLS and storage policies

-- Helper (idempotent): admin check
create or replace function public.is_admin()
returns boolean as $$
  select coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin', false);
$$ language sql stable;

-- Enable RLS on catalog tables
alter table if exists public.products enable row level security;
alter table if exists public.product_variants enable row level security;
alter table if exists public.product_media enable row level security;
alter table if exists public.collections enable row level security;
alter table if exists public.collection_entries enable row level security;
alter table if exists public.pages enable row level security;

-- Products: public can read active products
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (active = true);

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- Product Variants: public can read when parent product is active
drop policy if exists variants_public_read on public.product_variants;
create policy variants_public_read on public.product_variants
  for select using (
    exists (
      select 1 from public.products p where p.id = product_variants.product_id and p.active = true
    )
  );

drop policy if exists variants_admin_write on public.product_variants;
create policy variants_admin_write on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- Product Media: public can read when parent product is active
drop policy if exists media_public_read on public.product_media;
create policy media_public_read on public.product_media
  for select using (
    exists (
      select 1 from public.products p where p.id = product_media.product_id and p.active = true
    )
  );

drop policy if exists media_admin_write on public.product_media;
create policy media_admin_write on public.product_media
  for all using (public.is_admin()) with check (public.is_admin());

-- Collections: public can read published
drop policy if exists collections_public_read on public.collections;
create policy collections_public_read on public.collections
  for select using (published_at is not null and published_at <= now());

drop policy if exists collections_admin_write on public.collections;
create policy collections_admin_write on public.collections
  for all using (public.is_admin()) with check (public.is_admin());

-- Collection Entries: public can read entries of published collections
drop policy if exists ce_public_read on public.collection_entries;
create policy ce_public_read on public.collection_entries
  for select using (
    exists (
      select 1 from public.collections c where c.id = collection_entries.collection_id and c.published_at is not null and c.published_at <= now()
    )
  );

drop policy if exists ce_admin_write on public.collection_entries;
create policy ce_admin_write on public.collection_entries
  for all using (public.is_admin()) with check (public.is_admin());

-- Pages: public can read published
drop policy if exists pages_public_read on public.pages;
create policy pages_public_read on public.pages
  for select using (published_at is not null and published_at <= now());

drop policy if exists pages_admin_write on public.pages;
create policy pages_admin_write on public.pages
  for all using (public.is_admin()) with check (public.is_admin());

-- Orders/addresses RLS already configured in previous migration: owner read/write; admins can list.
-- Ensure RLS is enabled (idempotent)
alter table if exists public.orders enable row level security;
alter table if exists public.order_items enable row level security;
alter table if exists public.addresses enable row level security;

-- Storage policies for public read and admin write (applies to specific buckets)
-- Note: storage schema lives under 'storage' extension
create schema if not exists storage;

-- Public read for selected buckets
drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select using (
    bucket_id in ('product-images','collection-media','page-media')
  );

-- Admin write (insert/update/delete)
drop policy if exists storage_admin_insert on storage.objects;
create policy storage_admin_insert on storage.objects
  for insert with check (public.is_admin() and bucket_id in ('product-images','collection-media','page-media'));

drop policy if exists storage_admin_update on storage.objects;
create policy storage_admin_update on storage.objects
  for update using (public.is_admin() and bucket_id in ('product-images','collection-media','page-media')) with check (public.is_admin());

drop policy if exists storage_admin_delete on storage.objects;
create policy storage_admin_delete on storage.objects
  for delete using (public.is_admin() and bucket_id in ('product-images','collection-media','page-media'));


