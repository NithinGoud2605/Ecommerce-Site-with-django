import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Image } from 'react-bootstrap';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { getCollectionBySlug } from '../lib/catalogClient';
import Product from '../Components/Product';
import { useCatalogList } from '../hooks/useCatalogList';
import { setMeta, updateMeta, preloadImage } from '../lib/seo.js';
import MasonryGrid from '../Components/MasonryGrid';
import Hotspot from '../Components/Hotspot';

function CollectionDetailScreen() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collection, setCollection] = useState(null);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    let mounted = true;
    window.scrollTo(0, 0);
    async function run() {
      setLoading(true);
      const res = await getCollectionBySlug(slug);
      if (!mounted) return;
      if (res?.error) {
        setError(res.error);
      } else {
        setCollection(res.collection);
        // order by position ascending
        const ordered = (res.entries || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0));
        setEntries(ordered);
        setError(null);
      }
      setLoading(false);
    }
    run();
    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!collection) return;
    const season = collection?.season ? String(collection.season) : '';
    const baseTitle = collection?.title || 'Collection';
    const title = season ? `${season} ${baseTitle} – Handmade Hub` : `${baseTitle} – Handmade Hub`;
    const desc = collection?.summary || 'Latest curated looks and products.';
    const heroUrl = collection?.hero_media?.url || null;
    setMeta({ title, description: desc, image: heroUrl, type: 'article' });
    if (heroUrl) preloadImage(heroUrl);
  }, [collection]);

  const collectionId = useMemo(() => collection?.id || null, [collection]);
  // Filter products to collection via keyword on slug or name as a fallback if we don't have a direct field
  const { items: products, loading: productsLoading, error: productsError } = useCatalogList({ sort: 'newest', pageSize: 8, keyword: '' });

  return (
    <Container className="mt-3">
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : !collection ? (
        <Message variant="info">Collection not found</Message>
      ) : (
        <>
          <div className="mb-3" style={{ position:'relative' }}>
            {collection.hero_media?.url && (
              <div style={{ position:'relative', paddingTop: '56.25%' /* 16:9 */ }}>
                <img src={collection.hero_media.url} alt={collection.title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                <div className='position-absolute bottom-0 start-0 end-0 p-3 p-md-5' style={{ background:'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%)' }}>
                  <h1 className='text-white' style={{ fontFamily:'Playfair Display, serif', fontSize:'clamp(2rem,4vw,3rem)' }}>{collection.title}</h1>
                  {collection.summary && <p className='lead text-white-50 mb-0' style={{ maxWidth: 720 }}>{collection.summary}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Editorial grid */}
          {entries.length > 0 && (
            <>
              <h3 className="mt-4">Looks</h3>
              <MasonryGrid columns={3} gap={16}>
                {entries.map((e) => (
                  <div key={e.id} style={{ position:'relative' }}>
                    <img src={e.url} alt={e.caption || collection.title} style={{ width:'100%', height:'auto', display:'block', borderRadius: 8 }} />
                    {Array.isArray(e.hotspots) && e.hotspots.map((h, i) => (
                      <div key={i}>
                        <Hotspot x={h.x} y={h.y} product={{ id: h.productId, name: h.label }} label={h.label} />
                      </div>
                    ))}
                    {e.caption && <div className="text-muted mt-1" style={{ fontSize: '0.9rem' }}>{e.caption}</div>}
                  </div>
                ))}
              </MasonryGrid>
            </>
          )}

          {/* Products in this collection (basic: use latest products as placeholder if filtering not available) */}
          <h3 className="mt-4">Products</h3>
          {productsLoading ? (
            <Loader />
          ) : productsError ? (
            <Message variant="danger">{productsError}</Message>
          ) : (
            <div className='d-flex overflow-auto gap-3 pb-2'>
              {products.map((p) => (
                <div key={p._id} style={{ minWidth: 240 }}>
                  <Product product={p} enableQuickAdd={true} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Container>
  );
}

export default CollectionDetailScreen;


