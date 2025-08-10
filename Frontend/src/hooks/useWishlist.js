import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

export function useWishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [ids, setIds] = useState(new Set());

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); setIds(new Set()); return; }
    const { data, error } = await supabase.from('wishlists').select('product_id, variant_id').eq('user_id', user.id);
    if (error) return;
    setItems(data || []);
    setIds(new Set((data || []).map((d) => `${d.product_id}:${d.variant_id || ''}`)));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const has = useCallback((productId, variantId) => ids.has(`${productId}:${variantId || ''}`), [ids]);

  const add = useCallback(async (productId, variantId=null) => {
    if (!user) return { error: 'not_authenticated' };
    await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId, variant_id: variantId });
    await refresh();
    return { ok: true };
  }, [user, refresh]);

  const remove = useCallback(async (productId, variantId=null) => {
    if (!user) return { error: 'not_authenticated' };
    await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('variant_id', variantId);
    await refresh();
    return { ok: true };
  }, [user, refresh]);

  const toggle = useCallback(async (productId, variantId=null) => {
    const key = `${productId}:${variantId || ''}`;
    if (ids.has(key)) return remove(productId, variantId);
    return add(productId, variantId);
  }, [ids, add, remove]);

  return { items, has, add, remove, toggle, refresh };
}


