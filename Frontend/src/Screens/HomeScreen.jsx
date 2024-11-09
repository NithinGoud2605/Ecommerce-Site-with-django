import React, { useState, useEffect } from 'react';
import { Row, Col, Pagination } from 'react-bootstrap';
import axios from 'axios';
import Product from '../components/Product';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Hero from '../components/Hero'; // Keep Hero component
import { useLocation, useNavigate } from 'react-router-dom';

function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const location = useLocation();
  const navigate = useNavigate();

  const keyword = new URLSearchParams(location.search).get('keyword') || '';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/products?keyword=${keyword}&page=${page}`);
        setProducts(data.products);
        setPages(data.pages);
        setLoading(false);
      } catch (err) {
        setError(err.response ? err.response.data.detail : 'Error loading products');
        setLoading(false);
      }
    };

    fetchProducts();
  }, [keyword, page]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    navigate(`?keyword=${keyword}&page=${newPage}`);
  };

  return (
    <>
      <Hero />
      <h1 id="products" className="mt-4">Latest Products</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          <Row>
            {products.map(product => (
              <Col key={product._id} sm={12} md={6} lg={4} xl={3}>
                <Product product={product} />
              </Col>
            ))}
          </Row>
          {pages > 1 && (
            <Pagination className="mt-3">
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
      )}
    </>
  );
}

export default HomeScreen;
