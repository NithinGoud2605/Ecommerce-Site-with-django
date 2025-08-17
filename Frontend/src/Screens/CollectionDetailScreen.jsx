import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { getCollectionBySlug } from '../lib/catalogClient';
import Product from '../Components/Product';
import { useCatalogList } from '../hooks/useCatalogList';
import { setMeta, preloadImage } from '../lib/seo.js';
import MasonryGrid from '../Components/MasonryGrid';
import Hotspot from '../Components/Hotspot';

function CollectionDetailScreen() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collection, setCollection] = useState(null);
  const [entries, setEntries] = useState([]);

  // Load collection + entries
  useEffect(() => {
    let mounted = true;
    window.scrollTo(0, 0);
    (async () => {
      setLoading(true);
      const res = await getCollectionBySlug(slug);
      if (!mounted) return;
      if (res?.error) {
        setError(res.error);
      } else {
        setCollection(res.collection || null);
        const ordered = (res.entries || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0));
        setEntries(ordered);
        setError(null);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [slug]);

  // SEO + hero preload
  useEffect(() => {
    if (!collection) return;
    const season = collection?.season ? String(collection.season) : '';
    const baseTitle = collection?.title || 'Collection';
    const title = season ? `${season} ${baseTitle} – Vyshnavi Pelimelli` : `${baseTitle} – Vyshnavi Pelimelli`;
    const desc = collection?.summary || 'Latest curated looks and products.';
    const heroUrl = collection?.hero_media?.url || null;
    setMeta({ title, description: desc, image: heroUrl, type: 'article', canonical: window.location.href });
    if (heroUrl) preloadImage(heroUrl);
  }, [collection]);

  // JSON-LD
  const jsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection?.title || 'Collection',
    description: collection?.summary || '',
    image: collection?.hero_media?.url || undefined
  }), [collection]);

  const collectionId = useMemo(() => collection?.id || null, [collection]);

  // Prefer collectionId; fallback to keyword on title
  const {
    items: products = [],
    loading: productsLoading,
    error: productsError
  } = useCatalogList(
    collectionId
      ? { collectionId, sort: 'newest', page: 1, pageSize: 12 }
      : { sort: 'newest', page: 1, pageSize: 12, keyword: collection?.title || '' }
  );

  // Product rail scroll
  const railRef = useRef(null);
  const scrollRail = (dir) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    const step = card ? card.getBoundingClientRect().width + 16 : 300;
    el.scrollBy({ left: dir * step * 2, behavior: 'smooth' });
  };

  return (
    <main id="main">
      <Container className="mt-3">
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : !collection ? (
          <Message variant="info">Collection not found</Message>
        ) : (
          <>
            {/* ===== Hero (cinematic, zero CLS) ===== */}
            {collection.hero_media?.url && (
              <section className="mb-3" aria-label={`${collection.title} hero`}>
                <div className="position-relative aspect-169 overflow-hidden rounded-2">
                  <picture>
                    <source srcSet={collection.hero_media.url.replace(/\.[^.]+$/, '.avif')} type="image/avif" />
                    <source srcSet={collection.hero_media.url.replace(/\.[^.]+$/, '.webp')} type="image/webp" />
                    <img
                      src={collection.hero_media.url}
                      alt={collection.title}
                      width="2400" height="1350" decoding="async"
                      style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
                    />
                  </picture>
                  <div className="position-absolute bottom-0 start-0 end-0 p-3 p-md-5"
                    style={{ background:'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.45) 100%)' }}>
                    <h1 className="text-white" style={{ fontFamily:'Playfair Display, serif', fontSize:'clamp(2rem,4vw,3rem)' }}>
                      {collection.title}
                    </h1>
                    {collection.summary && (
                      <p className="lead text-white-50 mb-0" style={{ maxWidth: 720 }}>
                        {collection.summary}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ===== Editorial lookbook ===== */}
            {entries.length > 0 && (
              <section className="mt-4 lazy-section" aria-label="Looks">
                <h2 className="mb-3" style={{ fontFamily:'Playfair Display, serif' }}>Looks</h2>
                <MasonryGrid columns={3} gap={16}>
                  {entries.map((e) => {
                    const src = e.url || e.path || `${import.meta.env.BASE_URL}images/placeholder.webp`;
                    const ratio = (e.width && e.height) ? `${e.width}/${e.height}` : '4/5';
                    return (
                      <figure key={e.id} className="m-0 position-relative rounded-2 overflow-hidden" style={{ aspectRatio: ratio }}>
                        <picture>
                          <source srcSet={src.replace(/\.[^.]+$/, '.avif')} type="image/avif" />
                          <source srcSet={src.replace(/\.[^.]+$/, '.webp')} type="image/webp" />
                          <img
                            src={src}
                            alt={e.caption || collection.title}
                            loading="lazy"
                            width={e.width || 1200}
                            height={e.height || 1500}
                            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
                          />
                        </picture>

                        {/* Hotspots (accessible; component handles a11y) */}
                        {Array.isArray(e.hotspots) && e.hotspots.map((h, i) => (
                          <Hotspot
                            key={i}
                            x={h.x} y={h.y}
                            product={{ id: h.productId, name: h.label }}
                            label={h.label}
                          />
                        ))}
                        {e.caption && (
                          <figcaption className="text-muted mt-2" style={{ fontSize: '.9rem' }}>
                            {e.caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  })}
                </MasonryGrid>
              </section>
            )}

            {/* ===== Products in this collection ===== */}
            <section className="mt-4 lazy-section" aria-label="Products">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="mb-0" style={{ fontFamily:'Playfair Display, serif' }}>Products</h2>
                <div className="d-flex gap-2">
                  <Button variant="outline-dark" size="sm" aria-label="Scroll previous" onClick={() => scrollRail(-1)}>&larr;</Button>
                  <Button variant="outline-dark" size="sm" aria-label="Scroll next" onClick={() => scrollRail(1)}>&rarr;</Button>
                </div>
              </div>

              {productsLoading ? (
                <Loader />
              ) : productsError ? (
                <Message variant="danger">{productsError}</Message>
              ) : products.length === 0 ? (
                <Message variant="info">No products available for this collection yet.</Message>
              ) : (
                <div
                  ref={railRef}
                  className="d-flex gap-3 pb-2"
                  style={{
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {products.map((p) => (
                    <div key={p._id || p.id} data-card style={{ minWidth: 240, scrollSnapAlign: 'start' }}>
                      <Product product={p} enableQuickAdd={true} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          </>
        )}
      </Container>
    </main>
  );
}

export default CollectionDetailScreen;
