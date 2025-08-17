import React from "react";
import { Link } from "react-router-dom";

/**
 * LuxeHero — full-bleed editorial hero, like high-fashion sites.
 * - Uses <picture> (AVIF/WEBP/JPEG), explicit aspect, fetchpriority=high
 * - Left-aligned display title + smallcaps subtitle
 * - CTA (“VIEW COLLECTION”)
 * - Subtle gradient overlay for readability
 */
export default function LuxeHero({
  image,
  alt = "Editorial hero",
  title = "",
  subtitle = "Spring/Summer 2025",
  cta = { label: "VIEW COLLECTION", to: "/collection" },
  height = "min-h-[78vh] md:min-h-[86vh]",
  offsetRight = 'clamp(16px, 6vw, 72px)',
  offsetBottom = 'clamp(24px, 12vh, 160px)'
}) {
  const base = image || `${import.meta.env.BASE_URL}images/Editorial.avif`;
  const toType = (t) => base.replace(/\.[^.]+$/, `.${t}`);
  return (
    <>
      <section
        className={`relative ${height} w-full overflow-hidden full-bleed`}
        style={{ position: 'relative', minHeight: '86vh' }}
      >
        <div className="absolute inset-0 z-0">
          <img
            src={base}
            alt={alt}
            fetchPriority="high"
            width="2400"
            height="1200"
            className="absolute inset-0 h-full w-full object-cover z-0"
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:0 }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/15 to-transparent" style={{ zIndex: 1 }} />

        <div className="absolute inset-0 z-20">
          {/* Absolute, responsive-positioned content block */}
          <div
            className="hero-copy"
            style={{
              position: 'absolute',
              right: offsetRight,
              bottom: offsetBottom,
              zIndex: 50,
              maxWidth: 'min(92vw, 720px)'
            }}
          >
            <div
              className="text-white/90 uppercase tracking-[0.3em] mb-4"
              style={{ 
                fontSize: '0.95rem',
                fontWeight: 400,
                letterSpacing: '0.3em',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              {subtitle}
            </div>

            {title && (
              <h1 
                className="font-display text-[clamp(3rem,10vw,6rem)] leading-[0.85] text-white tracking-tight mb-6"
                style={{ 
                  fontFamily: 'Playfair Display, serif',
                  fontWeight: 200,
                  letterSpacing: '-0.03em'
                }}
              >
                {title}
              </h1>
            )}

            <Link
              to={cta.to}
              className="inline-flex items-center justify-center rounded-none bg-white/90 px-10 py-4 font-light tracking-[0.2em] text-black transition-all duration-300 hover:bg-white hover:scale-[1.02] uppercase"
              style={{ 
                fontSize: '0.85rem',
                letterSpacing: '0.2em',
                border: '1px solid rgba(255,255,255,0.3)',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
              aria-label={cta.label}
            >
              {cta.label}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}


