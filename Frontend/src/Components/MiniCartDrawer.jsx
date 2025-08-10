import React, { useEffect, useMemo, useRef } from 'react';
import { Button, Form, Image } from 'react-bootstrap';
import { useCart } from '../state/cartStore.jsx';
import { formatMoney } from '../utils/money.js';

export default function MiniCartDrawer({ open, onClose, onCheckout }) {
  const { items, subtotal_cents, setQty, removeItem } = useCart();
  const drawerRef = useRef(null);
  const announceRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = drawerRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    first?.focus();

    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab') {
        const focusable = drawerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    // Announce open to screen readers
    if (announceRef.current) announceRef.current.textContent = 'Cart opened';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (announceRef.current) announceRef.current.textContent = 'Cart closed';
    };
  }, [open, onClose]);

  const reduceMotion = useMemo(() => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  if (!open) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
      aria-hidden={!open}
      onClick={onClose}
    >
      <div aria-live="polite" aria-atomic="true" className="visually-hidden" ref={announceRef}></div>
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="position-absolute top-0 end-0 h-100 bg-white shadow"
        style={{ width: 'min(92vw, 420px)', transform: 'translateX(0)', transition: reduceMotion ? 'none' : 'transform 200ms cubic-bezier(0.33,1,0.68,1)' }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <h5 className="m-0">Your Cart</h5>
          <Button variant="outline-secondary" size="sm" onClick={onClose} aria-label="Close cart">×</Button>
        </div>

        <div className="p-3" style={{ overflowY: 'auto', maxHeight: 'calc(100% - 140px)' }}>
          {items.length === 0 ? (
            <div className="text-center text-muted">Your cart is empty.</div>
          ) : (
            items.map((it) => (
              <div key={it.variantId} className="d-flex align-items-start mb-3">
                <Image src={it.image_path} alt={it.name} rounded style={{ width: 64, height: 64, objectFit: 'cover' }} />
                <div className="ms-2 flex-grow-1">
                  <div className="fw-semibold">{it.name}</div>
                  <div className="text-muted small">{[it.size, it.color].filter(Boolean).join(' · ')}</div>
                  <div className="d-flex align-items-center mt-2">
                    <div className="input-group input-group-sm" style={{ width: 112 }}>
                      <button className="btn btn-outline-secondary" aria-label={`Decrease quantity for ${it.name}`} onClick={() => setQty(it.variantId, Math.max(it.qty - 1, 1))}>−</button>
                      <input className="form-control text-center" type="number" min={1} value={it.qty} onChange={(e) => setQty(it.variantId, Math.max(Number(e.target.value)||1,1))} aria-label={`Quantity for ${it.name}`} />
                      <button className="btn btn-outline-secondary" aria-label={`Increase quantity for ${it.name}`} onClick={() => setQty(it.variantId, it.qty + 1)}>＋</button>
                    </div>
                    <div className="ms-3 small">{formatMoney({ amount_cents: it.qty * it.price_cents, currency: it.currency })}</div>
                    <Button variant="link" size="sm" className="ms-auto text-danger" onClick={() => removeItem(it.variantId)} aria-label={`Remove ${it.name}`}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-top">
          <div className="d-flex justify-content-between">
            <span>Subtotal</span>
            <strong>{formatMoney({ amount_cents: subtotal_cents })}</strong>
          </div>
          <div className="text-muted small mb-2">Shipping calculated at checkout. Estimated tax shown at checkout.</div>
          <div className="d-grid gap-2">
            <Button variant="primary" disabled={items.length === 0} onClick={onCheckout}>Checkout</Button>
          </div>
        </div>
      </aside>
    </div>
  );
}


