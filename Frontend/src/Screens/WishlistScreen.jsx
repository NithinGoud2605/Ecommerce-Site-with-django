import React, { useEffect } from 'react';
import { Row, Col, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useWishlist } from '../hooks/useWishlist';
import Product from '../Components/Product';
import { setMeta } from '../lib/seo.js';
import axiosInstance from '../axiosInstance';

export default function WishlistScreen() {
  const { items, refresh, remove } = useWishlist();
  const [products, setProducts] = React.useState([]);

  useEffect(() => {
    setMeta({ title: 'Wishlist – Vyshnavi Pelimelli', description: 'Your saved pieces.' });
    refresh();
  }, [refresh]);

  const ids = React.useMemo(() => Array.from(new Set(items.map(i => i.product_id))), [items]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (ids.length === 0) { setProducts([]); return; }
      try {
        // Fetch product details from Django for each id in parallel
        const results = await Promise.all(ids.map(id => axiosInstance.get(`/api/products/${id}`)));
        if (!active) return;
        setProducts(results.map(r => r.data));
      } catch {
        setProducts([]);
      }
    })();
    return () => { active = false; };
  }, [ids]);

  return (
    <div aria-labelledby="wl-title">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 id="wl-title" className="mb-0">Wishlist</h1>
        <Button as={Link} to="/shop" variant="dark" className="rounded-1">Continue Shopping</Button>
      </div>
      {ids.length === 0 ? (
        <Alert variant="info">No items yet. Browse the <Link to="/shop">shop</Link> and tap the heart to save favorites.</Alert>
      ) : (
        <Row className="g-4">
          {products.map(p => (
            <Col key={p._id || p.id} xs={12} sm={6} md={4} lg={3}>
              <div className="position-relative">
                <Product product={p} enableQuickAdd={true} />
                <Button size="sm" variant="outline-secondary" className="position-absolute" style={{ right: 8, top: 8 }} onClick={() => remove(p._id || p.id)}>
                  Remove
                </Button>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}


