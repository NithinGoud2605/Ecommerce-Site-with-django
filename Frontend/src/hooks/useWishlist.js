import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';

function loadWishlist(userId) {
  try { return JSON.parse(localStorage.getItem(`wishlist:${userId}`) || '[]'); } catch { return []; }
}

function saveWishlist(userId, items) {
  try { localStorage.setItem(`wishlist:${userId}`, JSON.stringify(items)); } catch {}
}

export function useWishlist() {
  const { user } = useAuth();
  const userId = user?.id || null;
  const [items, setItems] = useState([]);
  const [ids, setIds] = useState(new Set());

  const refresh = useCallback(async () => {
    if (!userId) { setItems([]); setIds(new Set()); return; }
    const data = loadWishlist(userId);
    setItems(data);
    setIds(new Set((data || []).map((d) => `${d.product_id}:${d.variant_id || ''}`)));
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const onStorage = (e) => { if (e.key === `wishlist:${userId}`) refresh(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [userId, refresh]);

  const has = useCallback((productId, variantId) => ids.has(`${productId}:${variantId || ''}`), [ids]);

  const add = useCallback(async (productId, variantId=null) => {
    if (!userId) return { error: 'not_authenticated' };
    const next = [...items, { product_id: productId, variant_id: variantId }];
    setItems(next);
    setIds(new Set(next.map((d) => `${d.product_id}:${d.variant_id || ''}`)));
    saveWishlist(userId, next);
    return { ok: true };
  }, [userId, items]);

  const remove = useCallback(async (productId, variantId=null) => {
    if (!userId) return { error: 'not_authenticated' };
    const next = items.filter((it) => !(it.product_id === productId && (it.variant_id || null) === (variantId || null)));
    setItems(next);
    setIds(new Set(next.map((d) => `${d.product_id}:${d.variant_id || ''}`)));
    saveWishlist(userId, next);
    return { ok: true };
  }, [userId, items]);

  const toggle = useCallback(async (productId, variantId=null) => {
    const key = `${productId}:${variantId || ''}`;
    if (ids.has(key)) return remove(productId, variantId);
    return add(productId, variantId);
  }, [ids, add, remove]);

  return { items, has, add, remove, toggle, refresh };
}


