import React from "react";

export default function PressStrip({ items = [] }) {
  if (!items.length) return null;
  return (
    <section aria-label="Press logos" className="full-bleed border-top section-pad" style={{ borderColor: 'var(--line)', background:'rgba(248,248,248,0.8)' }}>
      <div className="container-max">
        <div
          className="d-flex flex-wrap align-items-center justify-content-center gap-4 gap-md-5"
          style={{ filter: 'grayscale(100%) contrast(0.8)', opacity: 0.9 }}
        >
          {items.slice(0, 8).map((p) => (
            <a
              key={p.id}
              href={p.article_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="d-inline-flex align-items-center"
              style={{ height: 40 }}
            >
              {p.hero_url ? (
                <img
                  src={p.hero_url}
                  alt={p.title}
                  width={140}
                  height={40}
                  loading="lazy"
                  style={{ maxHeight: 40, maxWidth: 150, objectFit: 'contain', transition: 'filter 160ms' }}
                />
              ) : (
                <span className="text-muted small">{p.title}</span>
              )}
            </a>
          ))}
        </div>

        <div className="mt-4 d-flex align-items-center justify-content-center gap-2">
          <span style={{ display:'inline-block', width:24, height:1, background:'#d1d5db' }} />
          <span style={{ display:'inline-block', width:24, height:1, background:'#d1d5db' }} />
        </div>
      </div>
      <style>{`[aria-label="Press logos"] a:hover img{filter:grayscale(0%) contrast(1);}`}</style>
    </section>
  );
}


