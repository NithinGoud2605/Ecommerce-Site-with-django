import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Container, Row, Col } from 'react-bootstrap';

function Hero({
  imageSrc = `${import.meta.env.BASE_URL}bgimage.png`,
  videoSrc = '',
  imageAlt = '',
  imageWidth = 2400,
  imageHeight = 1600,
  headline = 'The Iconic Zusi',
  subcopy = 'Hand embellished elegance, crafted to turn heads.',
  pretitle = 'New Collection',
  align = 'center', // 'left' | 'center' | 'right'
  ctas = [{ label: 'Explore the Collection', href: '/shop', variant: 'ink' }],
  marqueeItems = null, // array of strings for optional marquee below
  height = '86vh',
}) {
  const [allowMotion, setAllowMotion] = useState(true);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setAllowMotion(!media.matches);
    const onChange = (e) => setAllowMotion(!e.matches);
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  const handleShopNowClick = (e) => {
    e.preventDefault();
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  };

  const showVideo = Boolean(videoSrc) && allowMotion;

  const alignMap = {
    left: { justify: 'start', textAlign: 'start' },
    center: { justify: 'center', textAlign: 'center' },
    right: { justify: 'end', textAlign: 'end' },
  };
  const a = alignMap[align] || alignMap.center;

  const marqueeRef = useRef(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!Array.isArray(marqueeItems) || marqueeItems.length === 0) return;
    if (!marqueeRef.current) return;
    let rafId = 0; let start = 0; let x = 0;
    function step(ts){
      if (paused || !allowMotion){ rafId = requestAnimationFrame(step); return; }
      if (!start) start = ts; const dt = ts - start; start = ts;
      x -= dt * 0.05; marqueeRef.current.style.transform = `translateX(${x}px)`;
      if (Math.abs(x) > (marqueeRef.current.scrollWidth/2)) x = 0;
      rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [marqueeItems, paused, allowMotion]);

  return (
    <section className="hero-section hero--editorial" aria-label="Hero" style={{height}}>
      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 420, overflow: 'hidden' }}>
        {showVideo ? (
          <video
            src={videoSrc}
            muted
            loop
            playsInline
            autoPlay
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        ) : (
          <picture>
            <source srcSet={imageSrc.replace(/\.[^.]+$/, '.avif')} type="image/avif" />
            <source srcSet={imageSrc.replace(/\.[^.]+$/, '.webp')} type="image/webp" />
            <img
              src={imageSrc}
              alt={imageAlt}
              width={2560}
              height={1400}
              decoding="async"
              fetchpriority="high"
              sizes="100vw"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', aspectRatio: '16/9' }}
            />
          </picture>
        )}
        {/* Light overlay handled by CSS variant */}

        <div className="hero-overlay" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: a.textAlign, maxWidth: 820, padding: '0 1rem', margin: '0 auto' }}>
            {pretitle && <div className="hero-pre">{pretitle}</div>}
            <h1 className="hero-title">{headline}</h1>
            {subcopy && <p className="hero-text">{subcopy}</p>}
            <div className={`d-flex gap-2 justify-content-${a.justify}`} style={{marginTop:'1rem'}}>
              {(ctas || []).map((c, i) => (
                <a key={i} href={c.href} className={`btn ${c.variant === 'ink' ? 'btn-ink' : 'btn-ghost'}`}>{c.label}</a>
              ))}
            </div>
          </div>
        </div>
        {/* Scroll cue */}
        <div aria-hidden={true} style={{ position:'absolute', left:'50%', bottom: 16, transform:'translateX(-50%)', color:'var(--ink)', opacity:0.9 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: allowMotion ? 'nudge 2s ease-in-out infinite' : 'none' }}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <style>{`@keyframes nudge { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 6px); } }`}</style>
      </div>

      {Array.isArray(marqueeItems) && marqueeItems.length > 0 && (
        <div className="py-2" style={{ background: '#F5E6C8', color: '#111', overflow:'hidden' }} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
          <div className="d-flex" style={{ whiteSpace: 'nowrap' }}>
            <div ref={marqueeRef} className="d-flex gap-5" aria-live="polite" aria-atomic="true" tabIndex={0} role="marquee" aria-label="Highlights; focus to pause" onFocus={()=>setPaused(true)} onBlur={()=>setPaused(false)}>
              {[...marqueeItems, ...marqueeItems].map((t,i)=> (
                <div key={i} className="text-uppercase" style={{ letterSpacing: '0.08em', fontSize: '0.85rem' }}>{t}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Hero;
