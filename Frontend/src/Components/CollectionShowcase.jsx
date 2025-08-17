import React from "react";
import { Link } from "react-router-dom";

const BASE = import.meta.env.BASE_URL || "/static/";

function resolveImg(src, fallback) {
  if (!src) return fallback;
  const s = String(src).trim();
  // Reject Windows/absolute filesystem paths
  if (/^[a-zA-Z]:[\\/]/.test(s)) return fallback;
  // Absolute URL
  if (/^https?:\/\//i.test(s)) return s;
  // Already under vite base
  if (s.startsWith(BASE)) return s;
  // Starts with /images or images
  if (s.startsWith("/images/")) return `${BASE}images/${s.split("/").pop()}`;
  if (s.startsWith("images/")) return `${BASE}${s}`;
  // Filename only
  if (/^[\w.-]+\.(png|jpe?g|webp|avif)$/i.test(s)) return `${BASE}images/${s}`;
  return fallback;
}

const CollectionShowcase = ({ items: provided }) => {
  const FALLBACKS = [
    { img: `${BASE}images/Girl1.jpg`, title: "Architectural Tailoring", tag: "New Drop", href: "/collection" },
    { img: `${BASE}images/Girl2.jpg`, title: "Neo-Classic Menswear", tag: "Essentials", href: "/collection" },
    { img: `${BASE}images/Man.jpg`, title: "Couture Drapery", tag: "Limited", href: "/collection" },
  ];

  const incoming = Array.isArray(provided) ? provided : [];
  const normalized = incoming.map((it, i) => {
    const fb = FALLBACKS[i % 3].img;
    const resolved = resolveImg(it?.img || it?.hero_media?.url, fb);
    return {
      img: resolved,
      title: it?.title || FALLBACKS[i % 3].title,
      tag: it?.tag || (i === 0 ? 'New Drop' : i === 1 ? 'Essentials' : 'Limited'),
      href: it?.href || `/collection/${it?.slug || ''}` || FALLBACKS[i % 3].href,
    };
  });
  while (normalized.length < 3) normalized.push(FALLBACKS[normalized.length]);
  const items = normalized.slice(0, 3);

  const fallbackImgs = FALLBACKS.map(f => f.img);

  return (
    <section id="collections" className="full-bleed section-pad">
      <div className="container-max">
        <header className="mb-3 d-flex align-items-end justify-content-between">
          <div>
            <h2 className="font-display" style={{ fontSize:'clamp(1.75rem,3vw,2.25rem)', letterSpacing:'-0.01em' }}>Curated Collections</h2>
            <p className="mt-2 mb-0 text-muted" style={{ letterSpacing: '.02em' }}>
              Precision construction, fluid forms, responsible materials.
            </p>
          </div>
          <Link
            to="/collection"
            className="d-none d-md-inline-flex align-items-center text-decoration-none"
            style={{
              fontSize: '.85rem',
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: '#141416',
              opacity: .85
            }}
            onMouseEnter={(e)=> e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e)=> e.currentTarget.style.opacity = '.85'}
          >
            View All
          </Link>
        </header>

        <div className="row g-4">
          {items.map((item, i) => (
            <div className="col-12 col-sm-6 col-md-4" key={`${item.title}-${i}`}>
              <Link
                to={item.href || "/collection"}
                className="position-relative d-block overflow-hidden rounded-3 border"
                style={{ borderColor:'rgba(0,0,0,.06)', boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.06)' }}
                aria-label={`Open ${item.title}`}
              >
                {/* Portrait 4:5 aspect */}
                <div style={{ position:'relative', width:'100%', paddingTop:'125%' }}>
                  <img
                    src={resolveImg(item.img, fallbackImgs[i % 3])}
                    alt={`${item.title} — designer clothing editorial`}
                    loading="lazy"
                    width="1200"
                    height="1500"
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{ objectFit:'cover', transform:'scale(1)', transition:'transform .45s cubic-bezier(.2,.8,.2,1)' }}
                    onError={(e) => { e.currentTarget.src = fallbackImgs[i % 3]; }}
                  />
                  <div className="position-absolute top-0 start-0 end-0 bottom-0" style={{ background:'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 55%, rgba(255,255,255,0.42) 100%)' }} />
                </div>
                <div className="position-absolute bottom-0 start-0 end-0 p-3">
                  <span className="d-inline-flex align-items-center mb-2 rounded-pill px-3 py-1 text-xs" style={{ border:'1px solid rgba(0,0,0,0.1)', background:'rgba(255,255,255,0.7)', backdropFilter:'blur(6px)', letterSpacing:'.08em', textTransform:'uppercase' }}>
                    {item.tag}
                  </span>
                  <h3 className="mb-0" style={{ fontFamily:'Playfair Display, serif', fontSize:'1.125rem', color:'#111' }}>{item.title}</h3>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectionShowcase;
