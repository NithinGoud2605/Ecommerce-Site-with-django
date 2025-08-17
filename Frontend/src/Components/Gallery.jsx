import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Gallery
 * - Displays main image with thumbnail rail
 * - Keyboard navigation (ArrowLeft/ArrowRight to change, Enter/Space to activate thumbnail)
 * - Swipe on mobile to navigate
 * - Zoom on click (lightbox overlay), ESC to close
 * - Safe when only one image is provided
 */

function Thumbnail({ image, index, isActive, onSelect }) {
  return (
    <button
      type="button"
      className={`border-0 bg-transparent p-0 me-2 ${isActive ? 'opacity-100' : 'opacity-75'}`}
      onClick={() => onSelect(index)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(index);
        }
      }}
      aria-label={image?.alt || `Thumbnail ${index + 1}`}
      aria-current={isActive}
      style={{ outlineOffset: 2 }}
    >
      <img
        src={image?.url || image?.path || image}
        alt={image?.alt || ''}
        loading="lazy"
        decoding="async"
        style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }}
      />
    </button>
  );
}

export default function Gallery({ media }) {
  const images = useMemo(() => {
    if (!Array.isArray(media) || media.length === 0) return [];
    return media
      .slice()
      .sort((a, b) => (a?.position || 0) - (b?.position || 0))
      .map((m) => ({ ...m, src: m?.url || m?.path }));
  }, [media]);

  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const mainRef = useRef(null);
  const startX = useRef(0);
  const deltaX = useRef(0);

  useEffect(() => {
    function onKey(e) {
      if (zoomOpen && e.key === 'Escape') {
        setZoomOpen(false);
        return;
      }
      if (!zoomOpen) {
        if (e.key === 'ArrowLeft') setIndex((i) => (i > 0 ? i - 1 : Math.max(images.length - 1, 0)));
        if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % Math.max(images.length, 1));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomOpen, images.length]);

  useEffect(() => {
    setIndex(0);
  }, [images.length]);

  if (!images.length) return null;

  const current = images[index];

  function onTouchStart(e) {
    if (!e.touches || e.touches.length === 0) return;
    startX.current = e.touches[0].clientX;
    deltaX.current = 0;
  }

  function onTouchMove(e) {
    if (!e.touches || e.touches.length === 0) return;
    deltaX.current = e.touches[0].clientX - startX.current;
  }

  function onTouchEnd() {
    const threshold = 30;
    if (deltaX.current > threshold) {
      setIndex((i) => (i > 0 ? i - 1 : Math.max(images.length - 1, 0)));
    } else if (deltaX.current < -threshold) {
      setIndex((i) => (i + 1) % Math.max(images.length, 1));
    }
    deltaX.current = 0;
  }

  useEffect(() => {
    // Enable pinch zoom on lightbox image for mobile
    if (!zoomOpen) return;
    const el = document.querySelector('#lightbox-zoom-img');
    (async () => {
      try {
        const mod = await import('pinch-zoom-js');
        const PinchZoom = mod?.default || mod;
        if (el && PinchZoom) new PinchZoom(el, { tapZoomFactor: 2, zoomOutFactor: 1.2 });
      } catch {}
    })();
  }, [zoomOpen]);

  return (
    <div>
      <div
        ref={mainRef}
        className="mb-3 position-relative"
        style={{ borderRadius: 8, overflow: 'hidden' }}
      >
        <div style={{ position: 'relative', width: '100%', paddingTop: '125%' }}>
          <img
            src={current?.src}
            alt={current?.alt || ''}
            className="w-100 d-block"
            style={{ cursor: 'zoom-in', userSelect: 'none', touchAction: 'pan-y', position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
            onClick={() => setZoomOpen(true)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />
        </div>
      </div>

      <div className="d-flex" role="listbox" aria-label="Product images">
        {images.map((img, i) => (
          <Thumbnail key={img?.id || i} image={img} index={i} isActive={i === index} onSelect={setIndex} />)
        )}
      </div>

      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current?.alt || 'Zoomed product image'}
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.85)', zIndex: 1050 }}
          onClick={() => setZoomOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setZoomOpen(false);
          }}
        >
          <img
            src={current?.src}
            alt={current?.alt || ''}
            id="lightbox-zoom-img"
            style={{ maxWidth: '90%', maxHeight: '90%', cursor: 'zoom-out', touchAction: 'none' }}
          />
        </div>
      )}
    </div>
  );
}


