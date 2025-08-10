import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Container, Row, Col } from 'react-bootstrap';

function Hero({
  imageSrc = '/bgimage.png',
  videoSrc = '',
  headline = 'Quietly Remarkable',
  subcopy = 'Handcrafted pieces, considered materials, enduring forms.',
  align = 'center', // 'left' | 'center' | 'right'
  ctas = [], // [{ label, href, onClick, variant }]
  marqueeItems = null, // array of strings for optional marquee below
  height = '72vh',
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
    <section className="position-relative" aria-label="Hero">
      <div style={{ position: 'relative', width: '100%', height, minHeight: 420, overflow: 'hidden' }}>
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
          <img
            src={imageSrc}
            alt=""
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        )}
        {/* Legibility overlays */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.45) 100%)' }} />
        <div aria-hidden="true" className="d-md-none" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.55) 100%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Container>
            <Row className={`align-items-center justify-content-${a.justify} text-${a.textAlign}`} style={{ paddingTop: '18vh' }}>
              <Col md={10} lg={8} xl={6}>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 500, fontSize: 'clamp(2.25rem, 6vw, 4rem)', color: 'white', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                  {headline}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.82)', fontWeight: 300, fontSize: 'clamp(1rem, 2.6vw, 1.25rem)', marginTop: 16, marginBottom: 28 }}>
                  {subcopy}
                </p>
                <div className={`d-inline-flex gap-2 justify-content-${a.justify}`}>
                  {(ctas && ctas.length > 0) ? ctas.map((c, idx) => (
                    c.href ? (
                      <a key={idx} href={c.href} onClick={c.onClick} className={`btn btn-${c.variant || 'light'} btn-lg`}>{c.label}</a>
                    ) : (
                      <button key={idx} type="button" onClick={c.onClick} className={`btn btn-${c.variant || 'light'} btn-lg`}>{c.label}</button>
                    )
                  )) : (
                    <a href="#products" className="btn btn-light btn-lg" onClick={handleShopNowClick}>Shop Now</a>
                  )}
                </div>
              </Col>
            </Row>
          </Container>
        </div>
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
