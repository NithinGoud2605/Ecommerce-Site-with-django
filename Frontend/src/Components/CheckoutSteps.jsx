import React, { useMemo } from 'react';

export default function CheckoutSteps({ current = 0 }) {
  const steps = [
    { id: 0, label: 'Contact' },
    { id: 1, label: 'Shipping' },
    { id: 2, label: 'Review' },
  ];
  const reduceMotion = useMemo(() => (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), []);
  return (
    <div className="d-flex align-items-center justify-content-center gap-3 mb-4" aria-label="Checkout steps">
      {steps.map((s, i) => (
        <div key={s.id} className="d-flex align-items-center">
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center"
            aria-current={current === s.id}
            aria-label={`${s.label} step ${s.id + 1} of ${steps.length}`}
            style={{ width: 32, height: 32, background: current >= s.id ? '#0d6efd' : '#e9ecef', color: current >= s.id ? 'white' : '#6c757d', transition: reduceMotion ? 'none' : 'background-color 160ms ease' }}
          >
            {s.id + 1}
          </div>
          <div className="ms-2 me-2 fw-semibold" style={{ minWidth: 80, textAlign: 'left' }}>{s.label}</div>
          {i < steps.length - 1 && (
            <div className="flex-shrink-0" style={{ width: 48, height: 2, background: current > s.id ? '#0d6efd' : '#e9ecef', transition: reduceMotion ? 'none' : 'background-color 160ms ease' }} />
          )}
        </div>
      ))}
    </div>
  );
}