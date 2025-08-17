# Frontend Smoke Test Plan

Run this plan in two modes:
- Django mode (flag OFF): `VITE_CATALOG_SUPABASE_READS=false`
- Supabase mode (flag ON): `VITE_CATALOG_SUPABASE_READS=true`

Restart the dev server after changing env.

Prereqs
- Env vars in `Frontend/.env.local`:
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_ANON_KEY=...`
  - `VITE_API_BASE_URL=http://127.0.0.1:8000` (or prod URL)
  - `VITE_CATALOG_SUPABASE_READS=true|false`

1) Home New Arrivals strip
- Navigate to `/`.
- Expect: “New Arrivals” grid renders 8 cards, images do not shift layout (4:5 box).
- If no data available: section is omitted; no empty container.

2) Shop list: sorting and pagination
- Go to `/shop`.
- Change sort to each option: Newest, Name A–Z, Name Z–A, Price Low–High, Price High–Low.
- Expect: grid updates; pager shows next page when `hasMore` is true. Click next page; grid repopulates. No CLS.
- Dev-only caption shows data source: Supabase or Django.

3) Women filter
- Go to `/shop/women`.
- Expect: only women’s products. Pager works. No CLS.

4) Men filter
- Go to `/shop/men`.
- Expect: only men’s products. Pager works. No CLS.

5) Collections index
- Go to `/collection`.
- Expect: cards for published collections; seeded `SS25` appears with hero, title, season.
- If none published: tasteful “No collections available”.

6) Collection detail
- Click `SS25` → `/collection/ss25`.
- Expect: hero image, summary, editorial grid (entries ordered), products grid below. No console errors.

7) About page
- Go to `/about`.
- If published: hero (optional) and body content render.
- If unpublished: “About page is not published yet.”

8) Contact page
- Go to `/contact`.
- If published: hero/body render.
- Placeholder form shows; submit disabled (no network errors).

9) Telemetry (dev only)
- Open console: navigating lists should log
  - `catalog_read_attempt`, `catalog_read_success`, and `catalog_fallback_used` when applicable.

Acceptance
- All pages render without errors in both modes.
- No layout shift in product grids.
- Dev caption correctly indicates source; Supabase errors fall back to Django automatically.




