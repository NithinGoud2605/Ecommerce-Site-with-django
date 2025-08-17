import React, { useEffect, useMemo, useState } from 'react';
import { Container, Button, Form } from 'react-bootstrap';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { listCollections } from '../lib/catalogClient';
import CollectionCard from '../Components/CollectionCard';
import { setMeta, preloadImage } from '../lib/seo.js';

function CollectionIndexScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collections, setCollections] = useState([]);

  // UI state
  const [seasonFilter, setSeasonFilter] = useState('All');
  const [sort, setSort] = useState('newest'); // newest | oldest | az | za

  useEffect(() => {
    let mounted = true;
    window.scrollTo(0, 0);
    setMeta({
      title: 'Collections – Vyshnavi Pelimelli',
      description: 'Explore seasonal collections and curated looks from the atelier.',
      canonical: window.location.href,
    });
    (async () => {
      setLoading(true);
      const res = await listCollections();
      if (!mounted) return;
      if (Array.isArray(res)) {
        setCollections(res);
        setError(null);
        // Preload the largest hero to help LCP if it appears near the top
        const hero = res?.[0]?.hero_media?.url;
        if (hero) preloadImage(hero);
      } else if (res?.error) {
        setError(res.error);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Seasons (derived, stable)
  const seasons = useMemo(() => {
    const s = Array.from(
      new Set((collections || []).map(c => (c.season || '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    return ['All', ...s];
  }, [collections]);

  // Apply filter + sort
  const filtered = useMemo(() => {
    let list = collections.slice();
    if (seasonFilter !== 'All') {
      list = list.filter(c => String(c.season || '') === seasonFilter);
    }
    switch (sort) {
      case 'newest': list.sort((a,b) => new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0)); break;
      case 'oldest': list.sort((a,b) => new Date(a.published_at || a.created_at || 0) - new Date(b.published_at || b.created_at || 0)); break;
      case 'az': list.sort((a,b) => String(a.title||'').localeCompare(String(b.title||''))); break;
      case 'za': list.sort((a,b) => String(b.title||'').localeCompare(String(a.title||''))); break;
      default: break;
    }
    return list;
  }, [collections, seasonFilter, sort]);

  // JSON-LD ItemList for richer indexing
  const jsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: filtered.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${window.location.origin}/#/collection/${c.slug}`,
      name: c.title
    }))
  }), [filtered]);

  return (
    <main id="main">
      <Container className="mt-3">
        <header className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-3">
          <div>
            <h1 className="mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>Collections</h1>
            <div className="small text-muted" aria-live="polite">
              {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'collection' : 'collections'}`}
            </div>
          </div>
          <div className="d-flex gap-2 align-items-center">
            {/* Season filter chips */}
            <nav aria-label="Filter by season" className="d-none d-md-flex gap-1 flex-wrap">
              {seasons.map(s => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === seasonFilter ? 'dark' : 'outline-dark'}
                  className="rounded-1"
                  onClick={() => setSeasonFilter(s)}
                >
                  {s}
                </Button>
              ))}
            </nav>
            {/* Sort select */}
            <Form.Select
              aria-label="Sort collections"
              size="sm"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ width: 180 }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="az">A–Z</option>
              <option value="za">Z–A</option>
            </Form.Select>
          </div>
        </header>

        {/* Mobile seasons (scrollable chips) */}
        {seasons.length > 1 && (
          <div className="d-flex d-md-none gap-2 overflow-auto pb-2 mb-3" role="tablist" aria-label="Season filters">
            {seasons.map(s => (
              <button
                key={s}
                role="tab"
                aria-selected={s === seasonFilter}
                className={`btn btn-sm ${s === seasonFilter ? 'btn-dark' : 'btn-outline-dark'} rounded-1`}
                onClick={() => setSeasonFilter(s)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : filtered.length === 0 ? (
          <Message variant="info">No collections available</Message>
        ) : (
          <>
            {/* Mosaic grid */}
            <section className="lazy-section">
              <div className="mosaic-grid reveal-parent">
                {filtered.map((c, i) => {
                  // Asymmetric layout: large on pattern indices
                  const large = i % 7 === 0;
                  const span = large ? 8 : (i % 5 === 0 ? 6 : 4);
                  return (
                    <div
                      key={c.id}
                      className={`mosaic-item reveal`}
                      style={{ gridColumn: `span ${span}` }}
                    >
                      <CollectionCard collection={c} large={large} />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Local CSS for the mosaic and reveals */}
            <style>{`
              .mosaic-grid{
                display:grid;
                grid-template-columns: repeat(12, minmax(0,1fr));
                gap: 1.25rem; /* 20px */
              }
              @media (max-width: 1199px){
                .mosaic-grid{ grid-template-columns: repeat(8, minmax(0,1fr)); }
              }
              @media (max-width: 991px){
                .mosaic-grid{ grid-template-columns: repeat(6, minmax(0,1fr)); }
              }
              @media (max-width: 575px){
                .mosaic-grid{ grid-template-columns: repeat(2, minmax(0,1fr)); }
              }

              /* Subtle staggered reveals (auto-disabled by your global reduced-motion rules) */
              .reveal-parent .reveal{
                opacity: 0; transform: translateY(12px);
                transition: opacity 360ms ease, transform 360ms ease;
              }
              .reveal-parent .reveal.is-in{
                opacity: 1; transform: none;
              }
              @media (prefers-reduced-motion: reduce){
                .reveal-parent .reveal{ opacity:1 !important; transform:none !important; transition:none !important; }
              }
            `}</style>
          </>
        )}
      </Container>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}

export default CollectionIndexScreen;
