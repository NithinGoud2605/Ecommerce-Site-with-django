import React, { useEffect, useState } from 'react';

/**
 * Announcement — smooth, infinite marquee-style scroller.
 * - CSS animation with duplicated track for seamless loop
 * - Pauses on hover/focus; respects reduced motion
 * - Configurable speed and spacing via props
 */
export default function Announcement({
  items = [],
  durationSec = 20,
  gapPx = 48,
  background = '#F5E6C8',
  color = '#111',
  uppercase = true,
}) {
  const [paused, setPaused] = useState(false);
  const [allowMotion, setAllowMotion] = useState(true);

  useEffect(() => {
    const m = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setAllowMotion(!(m && m.matches));
    update();
    m && m.addEventListener && m.addEventListener('change', update);
    return () => m && m.removeEventListener && m.removeEventListener('change', update);
  }, []);

  if (!items.length) return null;

  const commonItemProps = { style: { textTransform: uppercase ? 'uppercase' : 'none' } };

  return (
    <div
      className="ann-wrap"
      style={{ background, color }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`ann-marquee ${paused || !allowMotion ? 'paused' : ''}`}
        style={{ ['--gap']: `${gapPx}px`, ['--duration']: `${durationSec}s` }}
        tabIndex={0}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        aria-live="polite"
        aria-atomic="true"
        role="marquee"
      >
        <ul className="ann-track">
          {items.map((t, i) => (
            <li key={`a-${i}`} className="ann-item"><span {...commonItemProps}>{t}</span></li>
          ))}
        </ul>
        <ul className="ann-track" aria-hidden>
          {items.map((t, i) => (
            <li key={`b-${i}`} className="ann-item"><span {...commonItemProps}>{t}</span></li>
          ))}
        </ul>
      </div>

      <style>{`
        .ann-wrap { width: 100%; overflow: hidden; padding: 8px 0; }
        .ann-marquee { display: flex; gap: var(--gap); }
        .ann-marquee.paused .ann-track { animation-play-state: paused; }
        .ann-track { 
          display: flex; 
          list-style: none; 
          margin: 0; padding: 0; 
          gap: var(--gap); 
          min-width: 100%; /* each track spans viewport width */
          align-items: center; 
          animation: ann-scroll var(--duration) linear infinite;
        }
        .ann-item { flex-shrink: 0; }
        .ann-item > span { letter-spacing: 0.08em; font-size: 0.85rem; white-space: nowrap; }
        @keyframes ann-scroll { 
          from { transform: translateX(0); } 
          to   { transform: translateX(calc(-100% - var(--gap))); } 
        }
      `}</style>
    </div>
  );
}



