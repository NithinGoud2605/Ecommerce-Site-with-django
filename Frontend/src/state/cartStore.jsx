import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

// Storage key with versioning
const STORAGE_KEY = 'cart:v1';
const STORAGE_VERSION = 1;

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
}

function isValidItem(it) {
  return (
    it &&
    typeof it.variantId !== 'undefined' &&
    typeof it.price_cents === 'number' &&
    typeof it.qty === 'number' &&
    typeof it.name === 'string'
  );
}

function sanitizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => ({
      variantId: it.variantId ?? it.id ?? it.variant_id,
      productId: it.productId ?? it.product_id ?? null,
      name: typeof it.name === 'string' ? it.name : String(it.name || ''),
      price_cents: typeof it.price_cents === 'number' ? it.price_cents : Number(it.price_cents) || 0,
      currency: typeof it.currency === 'string' ? it.currency : 'USD',
      qty: Number(it.qty) || 0,
      image_path: it.image_path ?? it.image ?? null,
      size: it.size ?? null,
      color: it.color ?? null,
    }))
    .filter(isValidItem)
    .filter((it) => it.qty > 0);
}

function computeSubtotalCents(items) {
  return items.reduce((sum, it) => sum + it.qty * (it.price_cents || 0), 0);
}

function generateCartId() {
  return `cart_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadInitialState() {
  const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
  const parsed = raw ? safeParse(raw) : null;
  if (!parsed || typeof parsed !== 'object') {
    return { id: generateCartId(), items: [], subtotal_cents: 0 };
  }
  const version = Number(parsed.version) || 0;
  const state = parsed.state && typeof parsed.state === 'object' ? parsed.state : {};
  const id = typeof state.id === 'string' && state.id ? state.id : generateCartId();
  const items = sanitizeItems(state.items);
  const subtotal_cents = computeSubtotalCents(items);
  return { id, items, subtotal_cents, _version: version };
}

// Actions
const ADD = 'ADD';
const REMOVE = 'REMOVE';
const SET_QTY = 'SET_QTY';
const CLEAR = 'CLEAR';

function reducer(state, action) {
  switch (action.type) {
    case ADD: {
      const v = action.payload.variant;
      const qty = Math.max(1, Number(action.payload.qty) || 1);
      const variantId = v?.variantId ?? v?.id;
      if (variantId == null) return state;

      const productId = v?.productId ?? v?.product_id ?? null;
      const name = v?.name ?? v?.productName ?? '';
      const price_cents = typeof v?.price_cents === 'number' ? v.price_cents : Number(v?.price_cents) || 0;
      const currency = v?.currency || 'USD';
      const image_path = v?.image_path ?? v?.image ?? v?.path ?? null;
      const size = v?.size ?? null;
      const color = v?.color ?? null;

      const existingIndex = state.items.findIndex((it) => it.variantId === variantId);
      let items;
      if (existingIndex >= 0) {
        items = state.items.slice();
        items[existingIndex] = { ...items[existingIndex], qty: items[existingIndex].qty + qty };
      } else {
        items = state.items.concat([{ variantId, productId, name, price_cents, currency, qty, image_path, size, color }]);
      }
      const subtotal_cents = computeSubtotalCents(items);
      return { ...state, items, subtotal_cents };
    }
    case REMOVE: {
      const variantId = action.payload.variantId;
      const items = state.items.filter((it) => it.variantId !== variantId);
      const subtotal_cents = computeSubtotalCents(items);
      return { ...state, items, subtotal_cents };
    }
    case SET_QTY: {
      const { variantId, qty } = action.payload;
      const nextQty = Math.max(0, Number(qty) || 0);
      let items = state.items.map((it) => (it.variantId === variantId ? { ...it, qty: nextQty } : it));
      items = items.filter((it) => it.qty > 0);
      const subtotal_cents = computeSubtotalCents(items);
      return { ...state, items, subtotal_cents };
    }
    case CLEAR: {
      return { ...state, items: [], subtotal_cents: 0 };
    }
    default:
      return state;
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const initial = useMemo(() => loadInitialState(), []);
  const [state, dispatch] = useReducer(reducer, initial);
  const idRef = useRef(initial.id || generateCartId());

  // Persist with versioning and corruption tolerance
  useEffect(() => {
    try {
      const payload = {
        version: STORAGE_VERSION,
        state: { id: idRef.current, items: state.items, subtotal_cents: state.subtotal_cents },
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {
      // ignore write failures
    }
  }, [state.items, state.subtotal_cents]);

  const addItem = useCallback((variant, qty = 1) => dispatch({ type: ADD, payload: { variant, qty } }), []);
  const removeItem = useCallback((variantId) => dispatch({ type: REMOVE, payload: { variantId } }), []);
  const setQty = useCallback((variantId, qty) => dispatch({ type: SET_QTY, payload: { variantId, qty } }), []);
  const clear = useCallback(() => dispatch({ type: CLEAR }), []);

  const itemCount = useMemo(() => state.items.reduce((sum, it) => sum + it.qty, 0), [state.items]);

  const value = useMemo(
    () => ({ id: idRef.current, items: state.items, subtotal_cents: state.subtotal_cents, itemCount, addItem, removeItem, setQty, clear }),
    [state.items, state.subtotal_cents, itemCount, addItem, removeItem, setQty, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider />');
  return ctx;
}


