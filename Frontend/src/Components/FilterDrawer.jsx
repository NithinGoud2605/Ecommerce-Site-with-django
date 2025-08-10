import React, { useEffect, useRef } from 'react';

export default function FilterDrawer({ open, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const el = ref.current;
    const first = el?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    first?.focus();
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab') {
        const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
        } else if (document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background:'rgba(0,0,0,0.5)', zIndex: 1060 }} onClick={onClose}>
      <aside ref={ref} role="dialog" aria-modal="true" aria-label="Filters" className="position-absolute top-0 end-0 h-100 bg-white shadow" style={{ width: 'min(92vw, 420px)' }} onClick={(e) => e.stopPropagation()} tabIndex={-1}>
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <h5 className="m-0">Filters</h5>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose} aria-label="Close filters">Close</button>
        </div>
        <div className="p-3" style={{ overflowY:'auto', maxHeight:'calc(100% - 60px)' }}>
          {children}
        </div>
      </aside>
    </div>
  );
}


