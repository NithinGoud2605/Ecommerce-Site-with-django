import React, { useState, useEffect } from 'react';
import { Row, Col, Pagination, Form, Container } from 'react-bootstrap';
import axiosInstance from '../axiosInstance';
import Product from '../Components/Product';
import { useCatalogList } from '../hooks/useCatalogList';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import Hero from '../Components/Hero';
import Announcement from '../Components/Announcement';
import FeaturedCollection from '../Components/FeaturedCollection';
import MasonryGrid from '../Components/MasonryGrid';
import { listCollections } from '../lib/catalogClient';
import Testimonials from '../Components/Testimonials';
import { useLocation, useNavigate } from 'react-router-dom';
import '../index.css';
import { setMeta } from '../lib/seo.js';
import { listPress } from '../lib/pressClient';
import { useImpression } from '../hooks/useImpression';

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
      title: 'Handmade Hub – Unique, handcrafted goods',
      description: 'Shop the latest handmade items and curated collections.',
    });
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(
          `/api/products/?keyword=${keyword}&page=${page}&sort_by=${sortBy}&order=${order}`
        );
        setProducts(data.products || []);
        setPages(data.pages || 1);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.response?.data?.detail || err.message || 'Error loading products');
        setLoading(false);
      }
    };

    fetchProducts();
  }, [keyword, page, sortBy, order]);

  // New Arrivals section powered by catalog hook (falls back automatically)
  const {
    items: newItems = [],
    loading: newLoading,
  } = useCatalogList({ sort: 'newest', page: 1, pageSize: 8 });

  const [featured, setFeatured] = useState(null);
  const [press, setPress] = useState([]);
  useEffect(() => {
    (async () => {
      const res = await listCollections();
      const first = Array.isArray(res) && res.length ? res[0] : null;
      setFeatured(first || null);
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

  return (
    <>
      <Hero />
      <Announcement items={["Limited Edition drop this Friday", "RSVP: Runway Preview", "Complimentary shipping over $200"]} />
      <Container className="mt-5" style={{ marginTop: '8rem' }}>
        {featured && (
          <>
            <h2 className="mb-4" style={{ fontFamily: 'Playfair Display, serif', fontSize:'2.25rem' }}>Featured Collection</h2>
            <FeaturedCollection collection={featured} />
          </>
        )}
      </Container>

      {/* Press strip */}
      {press.length > 0 && (
        <div className="mt-5" aria-label="Press logos">
          <Container>
            <div className="d-flex flex-wrap justify-content-center align-items-center gap-4" style={{ filter: 'grayscale(100%)) contrast(0.85)', opacity: 0.8 }}>
              {press.slice(0,8).map((p) => (
                <a key={p.id} href={p.article_url || '#'} target="_blank" rel="noreferrer" className="d-inline-flex align-items-center" style={{ height: 40 }}>
                  {p.hero_url ? (
                    <img src={p.hero_url} alt={p.title} style={{ maxHeight: 40, maxWidth: 120, objectFit: 'contain' }} />
                  ) : (
                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>{p.title}</span>
                  )}
                </a>
              ))}
            </div>
          </Container>
        </div>
      )}

      <Container id='products' className="home-screen-container mt-5" style={{ paddingTop: '2rem' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="home-title" style={{ fontFamily:'Playfair Display, serif', fontSize:'2.25rem' }}>Latest Products</h1>
          <Form.Group controlId="sortBy" className="sort-select">
            <Form.Label className="sort-label">Sort by:</Form.Label>
            <Form.Control
              as="select"
              value={`${sortBy}_${order}`}
              onChange={handleSortChange}
              className="sort-dropdown"
            >
              <option value="name_asc">Name (A - Z)</option>
              <option value="name_desc">Name (Z - A)</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
              <option value="rating_desc">Rating (High to Low)</option>
              <option value="rating_asc">Rating (Low to High)</option>
            </Form.Control>
          </Form.Group>
        </div>
        
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : products.length > 0 ? (
          <>
            <MasonryGrid columns={4} gap={24}>
              {products.map(product => (
                <Product key={product._id} product={product} enableQuickAdd={true} />
              ))}
            </MasonryGrid>
            {pages > 1 && (
              <Pagination className="pagination-container mt-4">
                {[...Array(pages).keys()].map(x => (
                  <Pagination.Item
                    key={x + 1}
                    active={x + 1 === page}
                    onClick={() => handlePageChange(x + 1)}
                  >
                    {x + 1}
                  </Pagination.Item>
                ))}
              </Pagination>
            )}
          </>
        ) : (
          <Message variant="info">No products found</Message>
        )}
      </Container>
      {/* New Arrivals strip */}
      {newLoading && newItems.length === 0 ? (
        <Loader />
      ) : newItems.length > 0 ? (
        <Container className="mt-5">
          <h2 className="mb-4" style={{ fontFamily:'Playfair Display, serif' }}>New Arrivals</h2>
          <MasonryGrid columns={4} gap={24}>
            {newItems.map((p) => (
              <Product key={p._id} product={p} enableQuickAdd={true} />
            ))}
          </MasonryGrid>
        </Container>
      ) : null}
      <Testimonials />
    </>
  );
}

export default HomeScreen;
