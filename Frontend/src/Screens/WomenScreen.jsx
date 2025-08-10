import React, { useMemo } from 'react';
import { Container, Row, Col, Pagination } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCatalogList } from '../hooks/useCatalogList';
import Product from '../Components/Product';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import FilterBar from '../Components/FilterBar';
import MasonryGrid from '../Components/MasonryGrid';
import { setMeta } from '../lib/seo.js';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function WomenScreen() {
  const navigate = useNavigate();
  const query = useQuery();
  const page = Number(query.get('page') || 1);
  const { items, loading, error, page: currentPage, hasMore, source } = useCatalogList({ gender: 'women', page, size: filters.size || undefined, color: filters.color || undefined });
  const [filters, setFilters] = React.useState({ gender: 'women', size: '', color: '' });
  const pages = currentPage + (hasMore ? 1 : 0);

  const goToPage = (p) => {
    const params = new URLSearchParams({ page: String(p) });
    navigate(`/shop/women?${params.toString()}`);
  };

  React.useEffect(() => {
    setMeta({ title: 'Women – Handmade Hub', description: 'Shop women’s handmade clothing and accessories.' });
  }, []);

  return (
    <Container className="mt-3">
      {import.meta.env.DEV && (
        <div style={{ fontSize: '0.8rem', opacity: 0.75 }} className="mb-2">via {source === 'supabase' ? 'Supabase' : 'Django'}</div>
      )}
      <h1>Women</h1>
      <FilterBar value={filters} onChange={setFilters} />
      {loading ? (
        <Loader />
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

export default WomenScreen;


