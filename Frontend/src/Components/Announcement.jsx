import React, { useEffect, useRef, useState } from 'react';

export default function Announcement({ items = [] }) {
  const [paused, setPaused] = useState(false);
  const ref = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    let start = null;
    let rafId = null;
    let x = 0;
    function step(ts) {
      if (paused) { rafId = requestAnimationFrame(step); return; }
      if (!start) start = ts;
      const dt = ts - start;
      start = ts;
      x -= dt * 0.05; // speed
      el.style.transform = `translateX(${x}px)`;
      if (Math.abs(x) > el.scrollWidth / 2) x = 0;
      rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [paused]);

  if (!items.length) return null;

  return (
    <div
      ref={containerRef}
      className="py-2"
      style={{ background: '#F5E6C8', color: '#111', overflow: 'hidden' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="d-flex" style={{ whiteSpace: 'nowrap' }}>
        <div
          ref={ref}
          className="d-flex gap-5"
          aria-live="polite"
          aria-atomic="true"
          tabIndex={0}
          role="marquee"
          aria-label="Announcements; focus to pause, press Escape to dismiss"
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              // Dismiss until next render
              const el = containerRef.current;
              if (el) el.style.display = 'none';
            }
          }}
        >
          {[...items, ...items].map((t, i) => (
            <div key={i} className="text-uppercase" style={{ letterSpacing: '0.08em', fontSize: '0.85rem' }}>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}


