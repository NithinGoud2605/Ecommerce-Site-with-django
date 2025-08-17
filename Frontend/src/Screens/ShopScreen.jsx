import React from 'react';
import { Container, Pagination, Button, Badge, Form } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCatalogList } from '../hooks/useCatalogList';
import Product from '../Components/Product';
import Message from '../Components/Message';
import FilterBar from '../Components/FilterBar';
import MasonryGrid from '../Components/MasonryGrid';
import FilterDrawer from '../Components/FilterDrawer';
import SkeletonProductCard from '../Components/SkeletonProductCard';
import { setMeta } from '../lib/seo.js';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function ShopScreen() {
  const navigate = useNavigate();
  const query = useQuery();

  // URL params
  const keyword = query.get('keyword') || '';
  const sort = query.get('sort') || 'newest';
  const page = Number(query.get('page') || 1);

  // ---- FILTER STATE (define BEFORE using in hook)
  const [filters, setFilters] = React.useState(() => ({
    gender: query.get('gender') || '',
    size: query.get('size') || '',
    color: query.get('color') || '',
  }));
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Keep URL in sync when filters change
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    params.set('sort', sort || 'newest');
    params.set('page', '1'); // reset page on filter change
    if (filters.gender) params.set('gender', filters.gender);
    if (filters.size) params.set('size', filters.size);
    if (filters.color) params.set('color', filters.color);
    const next = `/shop?${params.toString()}`;
    const current = window.location.hash?.slice(1) || window.location.pathname + window.location.search;
    if (!current.endsWith(next.replace('/#', ''))) {
      navigate(next, { replace: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Data hook
  const {
    items,
    loading,
    error,
    page: currentPage,
    hasMore,
    source,
  } = useCatalogList({
    keyword,
    sort,
    page,
    pageSize: 8,
    gender: filters.gender || undefined,
    size: filters.size || undefined,
    color: filters.color || undefined,
  });

  const pages = currentPage + (hasMore ? 1 : 0);

  // SEO
  React.useEffect(() => {
    setMeta({
      title: 'Shop – Vyshnavi Pelimelli',
      description: 'Browse the atelier catalog and curated pieces.',
    });
  }, []);

  // Handlers
  const handleSortChange = (e) => {
    const next = e.target.value;
    const params = new URLSearchParams({ page: '1', sort: next });
    if (keyword) params.set('keyword', keyword);
    if (filters.gender) params.set('gender', filters.gender);
    if (filters.size) params.set('size', filters.size);
    if (filters.color) params.set('color', filters.color);
    navigate(`/shop?${params.toString()}`);
    // no state change needed; URL drives the hook
  };

  const goToPage = (p) => {
    const params = new URLSearchParams({ page: String(p), sort });
    if (keyword) params.set('keyword', keyword);
    if (filters.gender) params.set('gender', filters.gender);
    if (filters.size) params.set('size', filters.size);
    if (filters.color) params.set('color', filters.color);
    navigate(`/shop?${params.toString()}`);
    // Scroll to top of grid
    setTimeout(() => {
      const el = document.getElementById('shop-grid-top');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  };

  const clearAll = () => setFilters({ gender: '', size: '', color: '' });

  const removeFilter = (key) => setFilters((f) => ({ ...f, [key]: '' }));

  return (
    <Container className="mt-3">
      {import.meta.env.DEV && (
        <div className="mb-2" style={{ fontSize: '0.8rem', opacity: 0.75 }}>
          via {source === 'supabase' ? 'Supabase' : 'Django'}
        </div>
      )}

      {/* Header row: title + mobile filters + sort */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h1 className="mb-0">Shop</h1>
        <div className="d-flex align-items-center gap-2">
          {/* Mobile Filters toggle */}
          <Button className="d-inline d-md-none" variant="outline-secondary" onClick={() => setDrawerOpen(true)}>
            Filters
          </Button>
          {/* Mobile sort */}
          <Form.Select
            aria-label="Sort products"
            value={sort}
            onChange={handleSortChange}
            className="d-inline d-md-none"
          >
            <option value="newest">Newest</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </Form.Select>
        </div>
      </div>

      {/* Desktop filter bar */}
      <div className="d-none d-md-block mb-2">
        <FilterBar
          showGender
          genderOptions={['women', 'men']}
          value={filters}
          onChange={setFilters}
          sort={sort}
          onSort={handleSortChange}
        />
      </div>

      {/* Active filter pills */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3" aria-live="polite">
        {keyword && (
          <Badge bg="light" text="dark" className="border">
            "{keyword}"
          </Badge>
        )}
        {filters.gender && (
          <Badge bg="dark" className="cursor-pointer" role="button" onClick={() => removeFilter('gender')}>
            {filters.gender} ×
          </Badge>
        )}
        {filters.size && (
          <Badge bg="dark" className="cursor-pointer" role="button" onClick={() => removeFilter('size')}>
            Size {filters.size} ×
          </Badge>
        )}
        {filters.color && (
          <Badge bg="dark" className="cursor-pointer" role="button" onClick={() => removeFilter('color')}>
            {filters.color} ×
          </Badge>
        )}
        {(filters.gender || filters.size || filters.color) && (
          <Button size="sm" variant="outline-secondary" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </div>

      {/* Drawer for mobile filters */}
      <FilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <FilterBar
          showGender
          genderOptions={['women', 'men']}
          value={filters}
          onChange={setFilters}
          sort={sort}
          onSort={handleSortChange}
        />
      </FilterDrawer>

      {/* Grid */}
      <div id="shop-grid-top" />
      {loading ? (
        <MasonryGrid columns={4} gap={16}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonProductCard key={i} />
          ))}
        </MasonryGrid>
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : items.length === 0 ? (
        <Message variant="info">No products found</Message>
      ) : (
        <>
          {/* Desktop sort duplicated above the grid for quick changes */}
          <div className="d-none d-md-flex justify-content-end mb-2">
            <Form.Group controlId="sortDesktop" className="d-flex align-items-center gap-2">
              <Form.Label className="mb-0 text-muted">Sort</Form.Label>
              <Form.Select aria-label="Sort products" value={sort} onChange={handleSortChange} size="sm">
                <option value="newest">Newest</option>
                <option value="name_asc">Name A–Z</option>
                <option value="name_desc">Name Z–A</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
              </Form.Select>
            </Form.Group>
          </div>

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


