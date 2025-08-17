import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Container, Card, Row, Col, ListGroup, Button } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import { useCart } from '../state/cartStore.jsx';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { setMeta } from '../lib/seo.js';

export default function SuccessScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const headingRef = useRef(null);

  // Prefer orderId from URL `?orderId=...` or router state, fall back to sessionStorage (set at checkout)
  const urlParams = new URLSearchParams(location.search);
  const orderId =
    urlParams.get('orderId') ||
    (location.state && location.state.orderId) ||
    sessionStorage.getItem('last_order_id') ||
    null;

  const { clear } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState(null);

  // Meta + noindex
  useEffect(() => {
    setMeta({
      title: 'Order Received – Vyshnavi Pelimelli',
      description: 'Thank you for your order.',
      // no image; we don't want this in SERP
    });
    // Ensure success pages aren't indexed
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    robots.setAttribute('content', 'noindex, nofollow');
  }, []);

  // Focus the heading for a11y
  useEffect(() => {
    const el = headingRef.current;
    if (!el) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) requestAnimationFrame(() => el.focus());
  }, []);

  // Fetch order summary (Django API)
  useEffect(() => {
    let aborted = false;
    async function run() {
      if (!orderId) return;
      try {
        setLoading(true);
        setError(null);
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
        const headers = userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : {};
        const { data } = await axiosInstance.get(`/api/orders/${orderId}/`, { headers });
        if (aborted) return;
        setOrder(data);
      } catch (e) {
        if (aborted) return;
        setError(e?.response?.data?.detail || e?.message || 'Failed to load order');
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    run();
    return () => { aborted = true; };
  }, [orderId]);

  // Prevent double cart-clears; clear only once per order
  useEffect(() => {
    if (!orderId) return;
    const key = `cart_cleared_for_order_${orderId}`;
    const already = sessionStorage.getItem(key);
    if (!already) {
      clear();
      sessionStorage.setItem(key, '1');
    }
  }, [orderId, clear]);

  // Fire purchase analytics (once)
  useEffect(() => {
    if (!order || !orderId) return;
    const key = `purchase_tracked_${orderId}`;
    if (sessionStorage.getItem(key)) return;

    const currency = 'USD';
    const value =
      typeof order.totalPrice === 'number'
        ? order.totalPrice
        : Number(order.totalPrice || 0);

    // Prefer your telemetry client if you have one
    try {
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'purchase',
          ecommerce: {
            transaction_id: String(orderId),
            value,
            currency,
            items: (order.orderItems || []).map((it) => ({
              item_id: String(it.product),
              item_name: it.name,
              price: Number(it.price || 0),
              quantity: Number(it.qty || 1),
            })),
          },
        });
      }
      // Fallback generic event
      if (window.gtag) {
        window.gtag('event', 'purchase', {
          transaction_id: String(orderId),
          value,
          currency,
        });
      }
    } catch (_) {}

    sessionStorage.setItem(key, '1');
  }, [order, orderId]);

  // JSON-LD for richer receipts in inboxes / clients (non-indexed page, but safe)
  const jsonLd = useMemo(() => {
    if (!order || !orderId) return null;
    const items = (order.orderItems || []).map((it) => ({
      '@type': 'Offer',
      name: it.name,
      price: String(it.price ?? 0),
      priceCurrency: 'USD',
      sku: String(it.product),
      itemOffered: { '@type': 'Product', name: it.name },
    }));
    return {
      '@context': 'https://schema.org',
      '@type': 'Order',
      orderNumber: String(orderId),
      priceCurrency: 'USD',
      price: String(order.totalPrice ?? 0),
      acceptedOffer: items,
      orderStatus: order.isPaid ? 'https://schema.org/OrderProcessing' : 'https://schema.org/OrderPaymentDue',
    };
  }, [order, orderId]);

  const printReceipt = () => window.print();

  if (!orderId) {
    return (
      <Container className="mt-4">
        <Card className="p-4 shadow-sm">
          <h1 tabIndex={-1} ref={headingRef}>Thank you</h1>
          <p>We've received your order. If you reached this page by mistake, you can review your recent orders from your profile.</p>
          <div className="d-flex gap-2">
            <Button as={Link} to="/profile" variant="outline-secondary">View Orders</Button>
            <Button as={Link} to="/shop" variant="primary">Continue Shopping</Button>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Card className="p-4 p-md-5 shadow-sm">
          <div className="mb-3">
            <h1 tabIndex={-1} ref={headingRef} className="mb-1">Thank you</h1>
            <div className="text-muted">Order <strong>#{orderId}</strong> is confirmed.</div>
          </div>

          <Row className="g-4">
            <Col md={8}>
              <ListGroup variant="flush">
                <ListGroup.Item className="border-0">
                  <h5 className="mb-2">Items</h5>
                  <div className="d-flex flex-column gap-2">
                    {(order.orderItems || []).map((it, i) => (
                      <div key={i} className="d-flex justify-content-between small">
                        <div className="text-truncate">{it.name} × {it.qty}</div>
                        <div>${(Number(it.qty) * Number(it.price || 0)).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="border-0">
                  <h5 className="mb-2">Shipping</h5>
                  <div className="small text-muted">
                    {order.shippingAddress?.address}{order.shippingAddress?.address2 ? `, ${order.shippingAddress.address2}` : ''}
                    {', '}
                    {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}, {order.shippingAddress?.country}
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="border-0">
                  <h5 className="mb-2">Payment</h5>
                  <div className="small">
                    Method: {order.paymentMethod || '—'}<br />
                    Status:{' '}
                    {order.isPaid ? (
                      <span className="text-success">Paid {String(order.paidAt || '').substring(0, 10)}</span>
                    ) : (
                      <span className="text-warning">Pending</span>
                    )}
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Col>

            <Col md={4}>
              <Card className="shadow-none border">
                <Card.Body>
                  <h5>Order Summary</h5>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Items</span>
                    <span>${Number(order.itemsPrice || 0).toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Shipping</span>
                    <span>${Number(order.shippingPrice || 0).toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Tax</span>
                    <span>${Number(order.taxPrice || 0).toFixed(2)}</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <strong>Total</strong>
                    <strong>${Number(order.totalPrice || 0).toFixed(2)}</strong>
                  </div>
                  <div className="d-flex flex-column gap-2 mt-3">
                    <Button as={Link} to={`/order/${orderId}`} variant="dark">View Order Details</Button>
                    <Button variant="outline-secondary" onClick={printReceipt}>Print Receipt</Button>
                    <Button as={Link} to="/shop" variant="outline-primary">Continue Shopping</Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {jsonLd && (
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          )}
        </Card>
      )}
    </Container>
  );
}


