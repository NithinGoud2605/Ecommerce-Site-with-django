import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Container, Pagination, Row, Col, Form } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCatalogList } from '../hooks/useCatalogList';
import Product from '../Components/Product';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import FilterBar from '../Components/FilterBar';
import MasonryGrid from '../Components/MasonryGrid';
import SkeletonProductCard from '../Components/SkeletonProductCard';
import { setMeta } from '../lib/seo.js';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function MenScreen() {
  const navigate = useNavigate();
  const query = useQuery();

  // --- URL params -> state (with sensible defaults)
  const pageFromUrl = Number(query.get('page') || 1);
  const sortFromUrl = query.get('sort') || 'newest'; // newest | name_asc | name_desc | price_asc | price_desc
  const sizeFromUrl = query.get('size') || '';
  const colorFromUrl = query.get('color') || '';

  const [page, setPage] = useState(pageFromUrl);
  const [sort, setSort] = useState(sortFromUrl);
  const [filters, setFilters] = useState({ gender: 'men', size: sizeFromUrl, color: colorFromUrl });

  // Keep URL in sync when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (sort !== 'newest') params.set('sort', sort);
    if (filters.size) params.set('size', filters.size);
    if (filters.color) params.set('color', filters.color);
    const qs = params.toString();
    navigate(`/shop/men${qs ? `?${qs}` : ''}`, { replace: true });
  }, [page, sort, filters.size, filters.color, navigate]);

  // Announce changes to assistive tech
  const srRef = useRef(null);
  useEffect(() => {
    const el = srRef.current;
    if (!el) return;
    el.textContent = `Page ${page}. Sorted by ${sort.replace('_', ' ')}.`;
  }, [page, sort]);

  // Meta
  useEffect(() => {
    setMeta({
      title: 'Men – Vyshnavi Pelimelli',
      description: 'Menswear from the atelier.',
      canonical: window.location.href,
    });
  }, []);

  // --- Data (note: we pass size/color; your hook can ignore or use them)
  const {
    items,
    loading,
    error,
    page: currentPage = page,
    hasMore,
    source,
  } = useCatalogList({
    gender: 'men',
    page,
    pageSize: 12,
    sort,                // use your hook’s sort mapping
    size: filters.size || undefined,
    color: filters.color || undefined,
  });

  // Pages indicator: if we don't know total, show "next" page
  const pages = currentPage + (hasMore ? 1 : 0);

  const goToPage = (p) => setPage(p);

  const onSortChange = (e) => {
    setSort(e.target.value);
    setPage(1);
  };

  // Skeleton grid helper
  const SkeletonGrid = ({ count = 12, columns = 4, gap = 16 }) => (
    <MasonryGrid columns={columns} gap={gap}>
      {Array.from({ length: count }).map((_, i) => <SkeletonProductCard key={i} />)}
    </MasonryGrid>
  );

  // JSON-LD for list
  const jsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Men',
    itemListElement: (items || []).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${window.location.origin}/#/product/${p.slug || p._id || p.id}`,
      name: p.name
    }))
  }), [items]);

  return (
    <main id="main">
      <Container className="mt-3">
        {/* SR live region for paging/sorting */}
        <div ref={srRef} className="visually-hidden" aria-live="polite" />

        {/* Dev source badge */}
        {import.meta.env.DEV && (
          <div style={{ fontSize: '0.8rem', opacity: 0.75 }} className="mb-2">
            via {source === 'supabase' ? 'Supabase' : 'Django'}
          </div>
        )}

        <Row className="align-items-end g-3 mb-2">
          <Col xs="12" md="6">
            <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="mb-0">Men</h1>
            <div className="text-muted small">Refined silhouettes, hand-finished details.</div>
          </Col>
          <Col xs="12" md="6">
            <div className="d-flex gap-2 justify-content-md-end">
              {/* Sort */}
              <Form.Select
                aria-label="Sort products"
                value={sort}
                onChange={onSortChange}
                style={{ maxWidth: 220 }}
              >
                <option value="newest">Newest</option>
                <option value="name_asc">Name (A–Z)</option>
                <option value="name_desc">Name (Z–A)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
              </Form.Select>
            </div>
          </Col>
        </Row>

        {/* Filters */}
        <FilterBar
          value={filters}
          onChange={(next) => {
            setFilters((prev) => ({ ...prev, ...next, gender: 'men' }));
            setPage(1);
          }}
        />

        {/* Results */}
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : !items || items.length === 0 ? (
          <Message variant="info">No products found</Message>
        ) : (
          <>
            <MasonryGrid columns={4} gap={16}>
              {items.map((p) => (
                <Product product={p} enableQuickAdd={true} key={p._id || p.id} />
              ))}
            </MasonryGrid>

            {/* Pagination (estimate when total unknown) */}
            {pages > 1 && (
              <Pagination className="mt-3" aria-label="Pagination">
                {Array.from({ length: pages }).map((_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={i + 1 === currentPage}
                    onClick={() => goToPage(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
              </Pagination>
            )}
          </>
        )}
      </Container>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
