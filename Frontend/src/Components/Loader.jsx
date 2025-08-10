import React from 'react';

export default function Loader({ compact = false }) {
  const size = compact ? 20 : 32;
  const shimmer = {
    background: 'linear-gradient(90deg, #f3efe6 25%, #efe9dc 37%, #f3efe6 63%)',
    backgroundSize: '400% 100%',
    animation: 'shimmer 1.1s infinite',
  };
  return (
    <div className="d-inline-flex align-items-center gap-2" aria-live="polite" aria-busy="true">
      <span className="rounded-circle" style={{ width: size, height: size, ...shimmer }} />
      {!compact && <span className='text-muted small'>Loading…</span>}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  );
}