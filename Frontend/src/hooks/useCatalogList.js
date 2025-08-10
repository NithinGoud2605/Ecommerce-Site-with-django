import { useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG_SUPABASE_READS } from '../config/flags';
import { listProducts as supaListProducts } from '../lib/catalogClient';
import { listProductsFallback as djangoListProducts } from '../lib/catalogFallback';
import { track } from '../lib/telemetry';

// Simple in-memory cache with TTL
const CACHE = new Map(); // key -> { ts: number, data: Result }
const TTL_MS = 60 * 1000;

function isFresh(entry) {
  if (!entry) return false;
  return Date.now() - entry.ts < TTL_MS;
}

function toKey(params) {
  // Include the flag so toggling source busts cache
  const keyObj = { ...params, flag: !!CATALOG_SUPABASE_READS };
  return JSON.stringify(keyObj);
}

function normalizeCard(product) {
  if (!product) return null;
  // Try to produce the shape expected by <Product /> card
  const firstMediaUrl = Array.isArray(product.media) && product.media.length > 0 ? product.media[0]?.url : null;
  // Compute price from variants if available
  let price = product.price;
  if (price == null && Array.isArray(product.variants) && product.variants.length) {
    const cents = product.variants
      .map((v) => (typeof v.price_cents === 'number' ? v.price_cents : Infinity))
      .filter((c) => Number.isFinite(c));
    if (cents.length) price = (Math.min(...cents) / 100).toFixed(2);
  }

  return {
    _id: product.id ?? product._id ?? null,
    name: product.name ?? null,
    image: product.image ?? firstMediaUrl ?? null,
    price: price != null ? Number(price) : null,
    rating: typeof product.rating === 'number' ? product.rating : 0,
    numReviews: typeof product.numReviews === 'number' ? product.numReviews : 0,
    countInStock: product.countInStock ?? null,
  };
}

/**
 * useCatalogList
 * @param {{ gender?: 'women'|'men'|'unisex', keyword?: string, sort?: 'newest'|'name_asc'|'name_desc'|'price_asc'|'price_desc', page?: number, pageSize?: number }} params
 * @returns {{ items: any[], loading: boolean, error: string|null, page: number, hasMore: boolean, source: 'supabase'|'django' }}
 */
export function useCatalogList({ gender, keyword = '', size, color, sort = 'newest', page = 1, pageSize = 8 } = {}) {
  const key = useMemo(() => toKey({ gender, keyword, size, color, sort, page, pageSize }), [gender, keyword, size, color, sort, page, pageSize]);
  const [state, setState] = useState(() => {
    const cached = CACHE.get(key);
    if (isFresh(cached)) {
      return { ...cached.data, loading: false };
    }
    return { items: [], loading: true, error: null, page, hasMore: false, source: CATALOG_SUPABASE_READS ? 'supabase' : 'django' };
  });
  const firstLoadRef = useRef(!isFresh(CACHE.get(key)));
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const preferSupabase = !!CATALOG_SUPABASE_READS;
      const expectedNonEmpty = !keyword && page === 1;

      async function trySupabase() {
        track('catalog_read_attempt', { source: 'supabase', params: { gender, keyword, size, color, sort, page, pageSize } });
        const res = await supaListProducts({ gender, keyword, size, color, sort, page, pageSize });
        if (res?.error) return res;
        // normalize items for card rendering
        const normalized = (res.items || []).map(normalizeCard);
        const out = { ...res, items: normalized };
        if (!res?.error) {
          track('catalog_read_success', { source: 'supabase', params: { gender, keyword, size, color, sort, page, pageSize }, itemCount: normalized.length });
        }
        return out;
      }

      async function tryDjango() {
        track('catalog_read_attempt', { source: 'django', params: { gender, keyword, size, color, sort, page, pageSize } });
        const res = await djangoListProducts({ keyword, page, sort });
        if (res?.error) return res;
        const normalized = (res.items || []).map(normalizeCard);
        const out = { ...res, items: normalized };
        if (!res?.error) {
          track('catalog_read_success', { source: 'django', params: { gender, keyword, size, color, sort, page, pageSize }, itemCount: normalized.length });
        }
        return out;
      }

      let result;
      let source = 'django';

      if (preferSupabase) {
        const supRes = await trySupabase();
        if (!supRes?.error && (supRes.items?.length || !expectedNonEmpty)) {
          result = supRes;
          source = 'supabase';
        } else {
          const fb = await tryDjango();
          result = fb;
          source = 'django';
          track('catalog_fallback_used', { params: { gender, keyword, size, color, sort, page, pageSize }, reason: supRes?.error ? 'error' : 'empty_when_expected' });
        }
      } else {
        const fb = await tryDjango();
        result = fb;
        source = 'django';
      }

      if (cancelled || !mountedRef.current) return;

      const next = {
        items: result?.items || [],
        loading: false,
        error: result?.error || null,
        page: typeof result?.page === 'number' ? result.page : page,
        hasMore: !!result?.hasMore,
        source,
      };

      CACHE.set(key, { ts: Date.now(), data: next });
      setState(next);
    }

    // Serve cached immediately (handled in initial state), then background refresh
    // Only flip loading true on first fetch for a given key
    if (firstLoadRef.current) {
      // We already set loading true in initial state; mark subsequent updates as not-first
      firstLoadRef.current = false;
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [key, gender, keyword, size, color, sort, page, pageSize]);

  return state;
}


