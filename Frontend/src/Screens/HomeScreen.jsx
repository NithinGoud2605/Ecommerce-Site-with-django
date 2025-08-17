import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Pagination, Form, Button } from 'react-bootstrap';
import axiosInstance from '../axiosInstance';
import Product from '../Components/Product';
import { useCatalogList } from '../hooks/useCatalogList';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import Hero from '../Components/Hero';
import LuxeHero from '../Components/LuxeHero';
import Announcement from '../Components/Announcement';
import FeaturedCollection from '../Components/FeaturedCollection';
import MasonryGrid from '../Components/MasonryGrid';
import CollectionShowcase from '../Components/CollectionShowcase';
import { listCollections } from '../lib/catalogClient';
import Testimonials from '../Components/Testimonials';
import PressStrip from '../Components/PressStrip';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import '../index.css';
import { setMeta, preloadImage } from '../lib/seo.js';
import { listPress } from '../lib/pressClient';

import SkeletonProductCard from '../Components/SkeletonProductCard';

function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('asc');

  const location = useLocation();
  const navigate = useNavigate();

  const keyword = new URLSearchParams(location.search).get('keyword') || '';

  useEffect(() => {
    setMeta({
      title: 'Vyshnavi Pelimelli – Designer Atelier',
      description: 'Architectural tailoring, couture drapery, and responsible materials by Vyshnavi Pelimelli.',
      canonical: window.location.href
    });
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(
          `/api/products/?keyword=${keyword}&page=${page}&sort_by=${sortBy}&order=${order}`
        );
        setProducts(data.products || []);
        setPages(data.pages || 1);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.response?.data?.detail || err.message || 'Error loading products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    // announce to SR users when sort/page changes
    const region = document.getElementById('sr-results-status');
    if (region) region.textContent = `Sorted by ${sortBy} ${order}. Page ${page}.`;
  }, [keyword, page, sortBy, order]);

  // New Arrivals (Supabase, falls back automatically)
  const {
    items: newItems = [],
    loading: newLoading,
  } = useCatalogList({ sort: 'newest', page: 1, pageSize: 8 });

  // Best Sellers (approx via rating when sales not available)
  const { items: bestSellers = [], loading: bestLoading } =
    useCatalogList({ sort: 'rating_desc', page: 1, pageSize: 8 });

  // Curated 4-up band
  const { items: luxury = [], loading: luxuryLoading } =
    useCatalogList({ gender: 'women', sort: 'newest', page: 1, pageSize: 4 });

  const [featured, setFeatured] = useState(null);
  const [collections, setCollections] = useState([]);
  const [press, setPress] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await listCollections();
      const first = Array.isArray(res) && res.length ? res[0] : null;
      setFeatured(first || null);
      setCollections(Array.isArray(res) ? res : []);
      if (first?.hero_media?.url) preloadImage(first.hero_media.url);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { items } = await listPress();
      setPress((items || []).slice(0, 8));
    })();
  }, []);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    navigate(`?keyword=${keyword}&page=${newPage}&sort_by=${sortBy}&order=${order}`);
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    const [newSortBy, newOrder] = value.split('_');
    setSortBy(newSortBy);
    setOrder(newOrder);
    setPage(1);
    navigate(`?keyword=${keyword}&page=1&sort_by=${newSortBy}&order=${newOrder}`);
  };

  // JSON-LD (Website SearchAction + ItemList for Best Sellers / New Arrivals)
  const websiteLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: window.location.origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${window.location.origin}/#/shop?keyword={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }), []);

  const listToItemList = (name, items) => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: (items || []).slice(0, 8).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${window.location.origin}/#/product/${p.slug || p._id || p.id}`,
      name: p.name
    }))
  });

  const bestLd = useMemo(() => listToItemList('Best Sellers', bestSellers), [bestSellers]);
  const newLd  = useMemo(() => listToItemList('New Arrivals', newItems), [newItems]);

  // Small helper: skeleton grid
  const SkeletonGrid = ({ count = 8, columns = 4, gap = 24 }) => (
    <MasonryGrid columns={columns} gap={gap}>
      {Array.from({ length: count }).map((_, i) => <SkeletonProductCard key={i} />)}
    </MasonryGrid>
  );

  return (
    <>
      {/* Screen reader live region for grid updates */}
      <div id="sr-results-status" className="visually-hidden" aria-live="polite" />

      <LuxeHero
        image={featured?.hero_media?.url || `${import.meta.env.BASE_URL}images/Editorial.jpg`}
        title={featured?.title || 'ANTHEA'}
        subtitle={''}
        cta={{
          label: 'VIEW COLLECTION',
          to: featured ? `/collection/${featured.slug}` : '/shop'
        }}
      />

      {/* Announcement moved to App.jsx above the navbar */}

      {/* Collections showcase (designer-style) */}
      {collections.length > 0 && (
        <CollectionShowcase
          items={collections.slice(0, 3).map((c, idx) => ({
            img: c?.hero_media?.url,
            title: c.title,
            tag: idx === 0 ? "New Drop" : idx === 1 ? "Essentials" : "Limited",
            href: `/collection/${c.slug}`,
          }))}
        />
      )}

      {/* Designer manifesto (full-bleed) */}
      <div className="full-bleed section-pad lazy-section" aria-label="Designer manifesto">
        <div className="container-max">
          <div style={{ maxWidth: 860 }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', lineHeight: 1.15 }}>
              Hand embellished elegance, crafted to turn heads
            </h2>
            <p className="lead text-muted" style={{ marginTop: 12 }}>
              Each garment is individually handcrafted by our atelier. Rich textures, meticulous beadwork,
              and silhouettes that celebrate the wearer — this is designer fashion with a soulful point of view.
            </p>
            <Button as={Link} to="/about" variant="outline-dark" className="rounded-1 px-4">About the House</Button>
          </div>
        </div>
      </div>

      {/* Editorial banner (full-bleed edge-to-edge) */}
      <section className="my-5 full-bleed" style={{ position:'relative' }} aria-label="Editorial banner">
        <div style={{ position:'relative', width:'100%', paddingTop:'40%', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, willChange:'transform', transform:'translateZ(0)' }}
               aria-hidden="true"
               ref={(el)=>{
                 if(!el) return;
                 const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                 if(reduce) { el.style.transform = 'translate3d(0,0,0)'; return; }
                 const onScroll = () => {
                   const rect = el.getBoundingClientRect();
                   const dy = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
                   el.style.transform = `translate3d(0, ${dy * -20}px, 0)`;
                 };
                 onScroll();
                 window.addEventListener('scroll', onScroll, { passive: true });
                 window.addEventListener('resize', onScroll);
                 setTimeout(onScroll, 0);
               }}>
            <img
              src={featured?.hero_media?.url || `${import.meta.env.BASE_URL}images/Editorial3.jpg`}
              alt={featured?.title || 'Editorial'}
              sizes="100vw"
              width="2400"
              height="960"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div className="position-absolute top-0 start-0 end-0 bottom-0" style={{ background:'rgba(0,0,0,0.25)' }} />
          <div className="position-absolute top-50 start-0 translate-middle-y text-start px-3 px-md-5" style={{ color:'#fff', maxWidth: 720 }}>
            <div className="text-uppercase" style={{ letterSpacing:'0.08em', opacity:0.85 }}>The Queen's Alchemy</div>
            <h2 style={{ fontFamily:'Playfair Display, serif', fontSize:'clamp(1.75rem,4vw,2.75rem)', marginTop:8 }}>
              A study in light, movement and hand
            </h2>
            <div className="d-flex gap-2 mt-2">
              <Button as={Link} to={featured ? `/collection/${featured.slug}` : '/shop'} variant="light" className="rounded-1 px-4">
                Shop the Collection
              </Button>
              <Button as={Link} to="/collection" variant="outline-light" className="rounded-1 px-4">View All</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured collection card (full-bleed) */}
      {/* Removed per request */}

      {/* Best Sellers (full-bleed) */}
      {/* Removed per request */}

      {/* Handcrafted Luxury – 4-up band (full-bleed) */}
      <div className="full-bleed section-pad lazy-section" aria-label="Signature pieces">
        <div className="container-max">
        <div className="text-center mb-4">
          <div className="text-uppercase text-muted" style={{ letterSpacing: '0.08em', fontSize: '0.85rem' }}>Handcrafted Luxury</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.25rem' }}>Our Signature Pieces</h2>
        </div>
        {luxuryLoading ? (
          <Row className="g-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Col key={i} xs={12} sm={6} md={3}><SkeletonProductCard /></Col>
            ))}
          </Row>
        ) : (
          <Row className="g-4">
            {(luxury || []).slice(0, 4).map((p) => (
              <Col key={p._id || p.id} xs={12} sm={6} md={3}>
                <Product product={p} enableQuickAdd={true} />
              </Col>
            ))}
          </Row>
        )}
        <div className="text-center mt-3">
          <Link
            to="/shop"
            className="text-decoration-none"
            style={{
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: '#3a3a3a',
              fontWeight: 600,
            }}
          >
            Shop
          </Link>
        </div>
        </div>
      </div>

      {/* Press strip */}
      <PressStrip items={press} />

      {/* New Arrivals removed */}

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bestLd) }} />
      {/* New Arrivals JSON-LD removed */}
    </>
  );
}

export default HomeScreen;
