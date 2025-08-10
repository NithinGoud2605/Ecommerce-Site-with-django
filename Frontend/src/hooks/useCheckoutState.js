import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'checkout:v1';
const STORAGE_VERSION = 1;

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
}

const defaultState = {
  step: 0,
  contact: { email: '' },
  shipping: {
    name: '',
    address: '',
    address2: '',
    city: '',
    region: '',
    postal: '',
    country: '',
    phone: '',
  },
};

export function useCheckoutState() {
  const [state, setState] = useState(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? safeParse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return defaultState;
    const version = Number(parsed.version) || 0;
    const s = parsed.state && typeof parsed.state === 'object' ? parsed.state : {};
    const step = Number(s.step) || 0;
    return {
      step: Math.min(Math.max(step, 0), 2),
      contact: { ...(defaultState.contact), ...(s.contact || {}) },
      shipping: { ...(defaultState.shipping), ...(s.shipping || {}) },
      _version: version,
    };
  });

  useEffect(() => {
    try {
      const payload = { version: STORAGE_VERSION, state: { step: state.step, contact: state.contact, shipping: state.shipping } };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {
      // ignore
    }
  }, [state.step, state.contact, state.shipping]);

  const updateContact = useCallback((patch) => setState((s) => ({ ...s, contact: { ...s.contact, ...patch } })), []);
  const updateShipping = useCallback((patch) => setState((s) => ({ ...s, shipping: { ...s.shipping, ...patch } })), []);
  const setStep = useCallback((step) => setState((s) => ({ ...s, step })), []);
  const reset = useCallback(() => setState(defaultState), []);

  return useMemo(
    () => ({ state, setStep, updateContact, updateShipping, reset }),
    [state, setStep, updateContact, updateShipping, reset]
  );
}


