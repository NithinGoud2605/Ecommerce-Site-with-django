import React, { useMemo } from 'react';
import { Container, Row, Col, Form, Pagination, Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCatalogList } from '../hooks/useCatalogList';
import Product from '../Components/Product';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import FilterBar from '../Components/FilterBar';
import MasonryGrid from '../Components/MasonryGrid';
import FilterDrawer from '../Components/FilterDrawer';
import SkeletonProductCard from '../Components/SkeletonProductCard';
import { setMeta } from '../lib/seo.js';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function ShopScreen() {
  const navigate = useNavigate();
  const query = useQuery();
  const keyword = query.get('keyword') || '';
  const sort = query.get('sort') || 'newest';
  const page = Number(query.get('page') || 1);

  const { items, loading, error, page: currentPage, hasMore, source } = useCatalogList({ keyword, sort, page, pageSize: 8, gender: filters.gender || undefined, size: filters.size || undefined, color: filters.color || undefined });

  const pages = currentPage + (hasMore ? 1 : 0);

  const handleSortChange = (e) => {
    const next = e.target.value;
    const params = new URLSearchParams({ keyword, page: '1', sort: next });
    navigate(`/shop?${params.toString()}`);
  };

  const goToPage = (p) => {
    const params = new URLSearchParams({ keyword, page: String(p), sort });
    navigate(`/shop?${params.toString()}`);
  };

  const [filters, setFilters] = React.useState({ gender: '', size: '', color: '' });
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    const base = 'Shop – Handmade Hub';
    const desc = 'Browse our full catalog of handmade products.';
    setMeta({ title: base, description: desc });
  }, []);

  return (
    <Container className="mt-3">
      {import.meta.env.DEV && (
        <div style={{ fontSize: '0.8rem', opacity: 0.75 }} className="mb-2">via {source === 'supabase' ? 'Supabase' : 'Django'}</div>
      )}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Shop</h1>
        <Button className="d-inline d-md-none" variant="outline-secondary" onClick={()=>setDrawerOpen(true)}>Filters</Button>
      </div>
      <div className="d-none d-md-block">
        <FilterBar showGender genderOptions={["women","men"]} value={filters} onChange={setFilters} sort={sort} onSort={handleSortChange} />
      </div>
      <FilterDrawer open={drawerOpen} onClose={()=>setDrawerOpen(false)}>
        <FilterBar showGender genderOptions={["women","men"]} value={filters} onChange={setFilters} sort={sort} onSort={handleSortChange} />
      </FilterDrawer>

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
          <MasonryGrid columns={4} gap={16}>
            {items.map((p) => (
              <Product product={p} enableQuickAdd={true} key={p._id} />
            ))}
          </MasonryGrid>
          {pages > 1 && (
            <Pagination className="mt-3">
              {Array.from({ length: pages }).map((_, i) => (
                <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => goToPage(i + 1)}>
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

export default ShopScreen;


