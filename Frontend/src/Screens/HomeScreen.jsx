import React, { useState, useEffect } from 'react';
import { Row, Col, Pagination, Form, Container } from 'react-bootstrap';
import axiosInstance from '../axiosInstance';
import Product from '../Components/Product';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import Hero from '../Components/Hero';
import Testimonials from '../Components/Testimonials';
import { useLocation, useNavigate } from 'react-router-dom';
import '../index.css';

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
      <Container id='products' className="home-screen-container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="home-title">Latest Products</h1>
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
            <Row className="product-grid">
              {products.map(product => (
                <Col key={product._id} sm={12} md={6} lg={4} xl={3} className="product-col mb-4">
                  <Product product={product} />
                </Col>
              ))}
            </Row>
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
      <Testimonials />
    </>
  );
}

export default HomeScreen;
