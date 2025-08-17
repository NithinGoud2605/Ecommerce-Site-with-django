import React, { useMemo, useState, useEffect } from 'react';
import { Container, Pagination, Button } from 'react-bootstrap';
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

function WomenScreen() {
  const navigate = useNavigate();
  const query = useQuery();

  // Read query params
  const page = Number(query.get('page') || 1);
  const sort = query.get('sort') || 'newest';
  const initialSize = query.get('size') || '';
  const initialColor = query.get('color') || '';

  // Filters state
  const [filters, setFilters] = useState({ gender: 'women', size: initialSize, color: initialColor });

  // Catalog data (call AFTER filters exist)
  const {
    items,
    loading,
    error,
    page: currentPage,
    hasMore,
    source
  } = useCatalogList({
    gender: 'women',
    page,
    pageSize: 8,
    sort,
    size: filters.size || undefined,
    color: filters.color || undefined
  });

  const pages = currentPage + (hasMore ? 1 : 0);

  const goToPage = (p) => {
    const params = new URLSearchParams({
      page: String(p),
      sort,
      ...(filters.size ? { size: filters.size } : {}),
      ...(filters.color ? { color: filters.color } : {}),
    });
    navigate(`/shop/women?${params.toString()}`);
  };

  const handleSortChange = (e) => {
    const next = e.target.value;
    const params = new URLSearchParams({
      page: '1',
      sort: next,
      ...(filters.size ? { size: filters.size } : {}),
      ...(filters.color ? { color: filters.color } : {}),
    });
    navigate(`/shop/women?${params.toString()}`);
  };

  const handleFiltersChange = (next) => {
    setFilters(next);
    const params = new URLSearchParams({
      page: '1',
      sort,
      ...(next.size ? { size: next.size } : {}),
      ...(next.color ? { color: next.color } : {}),
    });
    navigate(`/shop/women?${params.toString()}`);
  };

  useEffect(() => {
    setMeta({ title: 'Women – Vyshnavi Pelimelli', description: 'Shop womenswear from the atelier.' });
  }, []);

  return (
    <Container className="mt-3">
      {import.meta.env.DEV && (
        <div style={{ fontSize: '0.8rem', opacity: 0.75 }} className="mb-2">via {source === 'supabase' ? 'Supabase' : 'Django'}</div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-2">
        <h1 className="mb-0">Women</h1>
        {/* mobile drawer button lives inside FilterBar when you use it that way; keeping page clean */}
      </div>

      <FilterBar
        showGender={false}
        value={filters}
        onChange={handleFiltersChange}
        sort={sort}
        onSort={handleSortChange}
      />

      {/* a11y: announce results count */}
      <div className="visually-hidden" aria-live="polite">
        {loading ? 'Loading products…' : `${items.length} products loaded`}
      </div>

      {loading ? (
        <MasonryGrid columns={4} gap={16}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonProductCard key={i} />)}
        </MasonryGrid>
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : items.length === 0 ? (
        <Message variant="info">
          No products found. <Button variant="link" className="p-0" onClick={() => navigate('/shop')}>Browse all</Button>
        </Message>
      ) : (
        <>
          <MasonryGrid columns={4} gap={16}>
            {items.map((p) => (
              <Product product={p} enableQuickAdd={true} key={p._id || p.id} />
            ))}
          </MasonryGrid>

          {pages > 1 && (
            <Pagination className="mt-3">
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
  );
}

export default WomenScreen;


