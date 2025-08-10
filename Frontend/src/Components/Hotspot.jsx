import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Hotspot({ x = 50, y = 50, product, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div
      className="position-absolute"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', zIndex: 2 }}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`View ${label || product?.name || 'product'}`}
        className="d-inline-block border-0"
        style={{ width: 16, height: 16, borderRadius: '999px', background: '#C8A96A', outlineOffset: 2 }}
      />
      {open && (
        <div role="dialog" aria-label="Product" className="shadow" style={{ position:'absolute', left: 20, top: -8, background: 'white', borderRadius: 8, padding: 8, minWidth: 180 }} onMouseEnter={() => setOpen(true)}>
          <div className="d-flex align-items-center gap-2">
            <div style={{ width: 48, height: 48, background:'#eee', borderRadius: 6 }} />
            <div>
              <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{product?.name || 'Product'}</div>
              <Link to={`/product/${product?._id || product?.id || ''}`}>View</Link>
            </div>
          </div>
          <div className="text-end mt-1">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}


