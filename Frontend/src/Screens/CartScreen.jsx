import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Row, Col, ListGroup, Form, Button, ProgressBar } from 'react-bootstrap';
import Message from '../Components/Message';
import { useCart } from '../state/cartStore.jsx';
import CartTotals from '../Components/CartTotals.jsx';
import { setMeta } from '../lib/seo.js';
import { useCatalogList } from '../hooks/useCatalogList';
import Product from '../Components/Product';

const FREE_SHIPPING_THRESHOLD = 200; // USD

function CartScreen() {
  const navigate = useNavigate();
  const { items: cartItems, setQty, removeItem } = useCart();

  useEffect(() => {
    setMeta({ title: 'Cart – Vyshnavi Pelimelli', description: 'Review your cart and proceed to checkout.' });
  }, []);

  // Subtotal for progress & banner copy (independent of CartTotals UI)
  const subtotalCents = useMemo(
    () => cartItems.reduce((sum, it) => sum + (Number(it.price_cents) || 0) * (Number(it.qty) || 0), 0),
    [cartItems]
  );
  const subtotal = subtotalCents / 100;
  const remainingToFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const checkoutHandler = () => navigate('/login?redirect=shipping');

  // Recommend items based on the first cart item's gender (fallback to newest)
  const cartGender = useMemo(() => cartItems?.[0]?.gender || undefined, [cartItems]);
  const { items: also, loading: alsoLoading } = useCatalogList({
    gender: cartGender,
    sort: 'newest',
    page: 1,
    pageSize: 10,
  });

  // Recently viewed fallback
  const recently = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('recently_viewed_products') || '[]'); }
    catch { return []; }
  }, []);

  // Horizontal scroll helpers for the recommendation rail
  const railRef = useRef(null);
  const scrollByCards = (dir) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    const step = card ? card.getBoundingClientRect().width + 16 : 320;
    el.scrollBy({ left: dir * step * 2, behavior: 'smooth' });
  };

  return (
    <main id="main">
      {/* ===== Free shipping banner ===== */}
      <div className="mb-3 p-3 rounded-2" style={{ background: 'rgba(0,0,0,.04)' }} role="status" aria-live="polite">
        {remainingToFree > 0 ? (
          <>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-muted">You’re ${remainingToFree.toFixed(2)} away from <strong>free shipping</strong>.</span>
              <span className="small text-muted">{freeProgress}%</span>
            </div>
            <ProgressBar now={freeProgress} variant={freeProgress >= 100 ? 'success' : 'dark'} style={{ height: 6 }} />
          </>
        ) : (
          <div className="text-success small fw-semibold">You’ve unlocked <strong>free shipping</strong> 🥂</div>
        )}
      </div>

      <Row className="gy-4">
        {/* ===== Cart lines ===== */}
        <Col md={8}>
          <h1 className="mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Shopping Cart</h1>

          {cartItems.length === 0 ? (
            <Message variant="info">
              Your cart is empty. <Link to="/shop">Continue shopping</Link>
            </Message>
          ) : (
            <ListGroup variant="flush">
              {cartItems.map((item) => {
                const price = (Number(item.price_cents) || 0) / 100;
                const thumb = item.image_path || item.image || '/images/placeholder.webp';
                const label = [item.size, item.color].filter(Boolean).join(' · ');

                return (
                  <ListGroup.Item key={item.variantId} className="border-0 p-0 mb-3">
                    <Row className="align-items-center g-3">
                      {/* Thumbnail — stable aspect, responsive formats */}
                      <Col xs={4} md={2}>
                        <div className="rounded-2 overflow-hidden aspect-45 position-relative border">
                          <picture>
                            <source srcSet={thumb.replace(/\.[^.]+$/, '.avif')} type="image/avif" />
                            <source srcSet={thumb.replace(/\.[^.]+$/, '.webp')} type="image/webp" />
                            <img
                              src={thumb}
                              alt={item.name}
                              width="500" height="625" loading="eager" decoding="async"
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </picture>
                        </div>
                      </Col>

                      {/* Title / variant */}
                      <Col xs={8} md={4}>
                        <Link
                          to={`/product/${item.productId || ''}`}
                          className="text-decoration-none text-dark"
                        >
                          <div className="fw-medium">{item.name}</div>
                        </Link>
                        {label && <div className="text-muted small">{label}</div>}
                      </Col>

                      {/* Price */}
                      <Col xs={6} md={2}>
                        <div className="text-success" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          ${price.toFixed(2)}
                        </div>
                      </Col>

                      {/* Qty selector */}
                      <Col xs={6} md={3}>
                        <Form.Label className="visually-hidden">Quantity</Form.Label>
                        <Form.Select
                          aria-label={`Quantity for ${item.name}`}
                          value={item.qty}
                          onChange={(e) => setQty(item.variantId, Number(e.target.value))}
                          className="rounded"
                        >
                          {Array.from({ length: 20 }).map((_, x) => (
                            <option key={x + 1} value={x + 1}>{x + 1}</option>
                          ))}
                        </Form.Select>
                      </Col>

                      {/* Remove */}
                      <Col xs={12} md={1} className="d-flex justify-content-md-end">
                        <Button
                          type="button"
                          variant="outline-danger"
                          className="btn-sm"
                          aria-label={`Remove ${item.name} ${label ? `(${label})` : ''} from cart`}
                          onClick={() => removeItem(item.variantId)}
                        >
                          <i className="fas fa-trash" aria-hidden="true" />
                        </Button>
                      </Col>
                    </Row>
                    <hr className="mt-3 mb-0" />
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          )}

          {/* Returns & care note */}
          {cartItems.length > 0 && (
            <div className="small text-muted mt-3">
              Estimated taxes and duties are calculated at checkout. Complimentary returns within 14 days for full-price items.
            </div>
          )}

          {/* Continue shopping CTA */}
          <div className="mt-4">
            <Link to="/shop" className="btn btn-outline-dark rounded-1 px-4">Continue Shopping</Link>
          </div>
        </Col>

        {/* ===== Summary (sticky) ===== */}
        <Col md={4}>
          <div style={{ position: 'sticky', top: '84px' }}>
            {/* Optional mini promo field (frontend only; hook to backend when ready) */}
            <div className="p-3 rounded-2 mb-3" style={{ background: 'rgba(0,0,0,.03)' }}>
              <Form.Group controlId="promo">
                <Form.Label className="small text-muted mb-1">Promo code</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control type="text" placeholder="Enter code" className="rounded" />
                  <Button variant="dark" className="rounded-1">Apply</Button>
                </div>
              </Form.Group>
            </div>

            <CartTotals
              cta={(
                <ListGroup.Item className="border-0">
                  <Button
                    type="button"
                    className="btn btn-dark w-100 rounded-1"
                    disabled={cartItems.length === 0}
                    onClick={checkoutHandler}
                  >
                    Proceed To Checkout
                  </Button>
                </ListGroup.Item>
              )}
            />

            {/* Free shipping badge under summary (mobile duplication is fine) */}
            <div className="mt-2 small text-muted">
              {remainingToFree > 0
                ? <>Add <strong>${remainingToFree.toFixed(2)}</strong> more for free shipping.</>
                : <>Free shipping applied.</>}
            </div>

            {/* Cross-sell rail */}
            {(also.length > 0 || recently.length > 0) && (
              <section className="mt-4 lazy-section" aria-label="You may also like">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="mb-0">You may also like</h5>
                  <div className="d-flex gap-2">
                    <Button variant="outline-dark" size="sm" aria-label="Scroll previous" onClick={() => scrollByCards(-1)}>&larr;</Button>
                    <Button variant="outline-dark" size="sm" aria-label="Scroll next" onClick={() => scrollByCards(1)}>&rarr;</Button>
                  </div>
                </div>
                <div
                  ref={railRef}
                  className="d-flex gap-3 pb-2"
                  style={{
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {(also.length ? also : recently).map((p) => (
                    <div
                      key={p._id || p.id}
                      data-card
                      style={{ minWidth: 220, scrollSnapAlign: 'start' }}
                    >
                      <Product
                        product={{
                          _id: p._id || p.id,
                          id: p._id || p.id,
                          slug: p.slug,
                          name: p.name,
                          image: p.image || p.hero_url,
                          media: p.media,
                          variants: p.variants
                        }}
                        enableQuickAdd={true}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </Col>
      </Row>
    </main>
  );
}

export default CartScreen;
