import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Row, Col, ListGroup, Image, Card, Badge } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import Message from '../Components/Message';   // fixed casing
import Loader from '../Components/Loader';     // fixed casing
import { PayPalButton } from 'react-paypal-button-v2';
import { setMeta } from '../lib/seo.js';

const fmtMoney = (n) => {
  const num = Number(n || 0);
  try { return new Intl.NumberFormat(undefined, { style:'currency', currency:'USD' }).format(num); }
  catch { return `$${num.toFixed(2)}`; }
};
const fmtDateTime = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

export default function OrderScreen() {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const srRef = useRef(null);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);
  const [loadingDeliver, setLoadingDeliver] = useState(false);
  const [error, setError] = useState('');

  const userInfo = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch { return null; }
  }, []);

  // Meta
  useEffect(() => {
    setMeta({ title: `Order ${orderId} – Vyshnavi Pelimelli`, description: 'View your order details.' });
  }, [orderId]);

  // Guard
  useEffect(() => {
    if (!userInfo) navigate('/login');
  }, [userInfo, navigate]);

  // Fetch order
  const fetchOrder = useCallback(async () => {
    if (!userInfo) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosInstance.get(`/api/orders/${orderId}/`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setOrder(data);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId, userInfo]);

  // PayPal script
  const addPayPalScript = useCallback(() => {
    if (window.paypal) { setSdkReady(true); return; }
    const client = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AZwDkJqc5foh6saGrob4XQEW7xJ7Eq0xJmYemGmaPGtmjMaNG0D7SnWpngIZqVpdwlF1WVbaNQTMtNR6';
    const scriptId = 'pp-sdk';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'text/javascript';
    script.src = `https://www.paypal.com/sdk/js?client-id=${client}&currency=USD`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setError('Failed to load PayPal SDK.');
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (order && !order.isPaid) addPayPalScript();
  }, [order, addPayPalScript]);

  // SR announce
  useEffect(() => {
    if (!order || !srRef.current) return;
    const el = srRef.current;
    const txt = `Order ${order._id || order.id}. ${order.isPaid ? 'Paid' : 'Not paid'}. ${order.isDelivered ? 'Delivered' : 'Not delivered'}.`;
    el.textContent = txt;
  }, [order]);

  // Actions
  const successPaymentHandler = async (paymentResult) => {
    try {
      setLoadingPay(true);
      await axiosInstance.put(
        `/api/orders/${orderId}/pay/`,
        paymentResult || {},
        { headers: { 'Content-type': 'application/json', Authorization: `Bearer ${userInfo.token}` } }
      );
      // live update
      setOrder((o) => ({ ...(o || {}), isPaid: true, paidAt: new Date().toISOString(), paymentResult: paymentResult || {} }));
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Payment update failed');
    } finally {
      setLoadingPay(false);
    }
  };

  const deliverHandler = async () => {
    try {
      setLoadingDeliver(true);
      await axiosInstance.put(`/api/orders/${orderId}/deliver/`, {}, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setOrder((o) => ({ ...(o || {}), isDelivered: true, deliveredAt: new Date().toISOString() }));
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to mark delivered');
    } finally {
      setLoadingDeliver(false);
    }
  };

  const copyOrderId = async () => {
    try { await navigator.clipboard.writeText(String(orderId)); } catch {}
  };

  const printInvoice = () => {
    if (!printableRef.current) return window.print();
    window.print();
  };

  // Derivations
  const items = order?.orderItems || [];
  const totals = useMemo(() => ({
    items: order?.itemsPrice ?? 0,
    shipping: order?.shippingPrice ?? 0,
    tax: order?.taxPrice ?? 0,
    total: order?.totalPrice ?? 0,
  }), [order]);

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!order) return <Message variant="info">Order not found</Message>;

  const isAdmin = !!(userInfo?.isAdmin || userInfo?.is_staff);

  return (
    <div>
      {/* SR live region */}
      <div ref={srRef} className="visually-hidden" aria-live="polite" />

      <header className="d-flex align-items-center justify-content-between gap-2 mb-2">
        <h1 className="mb-0" style={{ fontFamily:'Playfair Display, serif' }}>
          Order <span className="text-muted">#{order._id || order.id}</span>
        </h1>
        <div className="d-flex gap-2">
          <Button variant="outline-dark" onClick={copyOrderId} title="Copy order number">Copy ID</Button>
          <Button variant="dark" onClick={printInvoice}>Print / Save PDF</Button>
        </div>
      </header>

      {/* Timeline badges */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <Badge bg="secondary">Created {fmtDateTime(order.createdAt || order.created_at)}</Badge>
        {order.isPaid ? (
          <Badge bg="success">Paid {fmtDateTime(order.paidAt)}</Badge>
        ) : (
          <Badge bg="warning" text="dark">Not Paid</Badge>
        )}
        {order.isDelivered ? (
          <Badge bg="dark">Delivered {fmtDateTime(order.deliveredAt)}</Badge>
        ) : (
          <Badge bg="info" text="dark">Not Delivered</Badge>
        )}
      </div>

      <Row ref={printableRef}>
        <Col md={8}>
          <ListGroup variant="flush">

            <ListGroup.Item>
              <h2 className="h4">Shipping</h2>
              <div className="small text-muted">We’ll email updates to you as the status changes.</div>
              <div className="mt-2">
                <div><strong>Name:</strong> {order.user?.name || '—'}</div>
                <div><strong>Email:</strong> {order.user?.email ? <a href={`mailto:${order.user.email}`}>{order.user.email}</a> : '—'}</div>
                <div className="mt-1">
                  <strong>Address:</strong>{' '}
                  {order.shippingAddress
                    ? `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`
                    : '—'}
                </div>
              </div>
              <div className="mt-2">
                {order.isDelivered
                  ? <Message variant="success" className="mb-0">Delivered on {fmtDateTime(order.deliveredAt)}</Message>
                  : <Message variant="warning" className="mb-0">Not Delivered</Message>}
              </div>
            </ListGroup.Item>

            <ListGroup.Item>
              <h2 className="h4">Payment Method</h2>
              <div><strong>Method:</strong> {order.paymentMethod || '—'}</div>
              <div className="mt-2">
                {order.isPaid
                  ? <Message variant="success" className="mb-0">Paid on {fmtDateTime(order.paidAt)}</Message>
                  : <Message variant="warning" className="mb-0">Not Paid</Message>}
              </div>
            </ListGroup.Item>

            <ListGroup.Item>
              <h2 className="h4">Items</h2>
              {items.length === 0 ? (
                <Message variant="info">Order is empty</Message>
              ) : (
                <ListGroup variant="flush">
                  {items.map((item, idx) => (
                    <ListGroup.Item key={idx} className="py-3">
                      <Row className="align-items-center g-2">
                        <Col xs={2} md={1}>
                          <Image src={item.image} alt={item.name} fluid rounded />
                        </Col>
                        <Col>
                          <Link to={`/product/${item.product}`} className="text-decoration-none">{item.name}</Link>
                          <div className="text-muted small">
                            {[item.size, item.color].filter(Boolean).join(' · ')}
                          </div>
                        </Col>
                        <Col md={4} className="text-md-end">
                          {item.qty} × {fmtMoney(item.price)} = <strong>{fmtMoney(Number(item.qty) * Number(item.price))}</strong>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm">
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h2 className="h4 mb-0">Order Summary</h2>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Items:</Col>
                  <Col className="text-end">{fmtMoney(totals.items)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Shipping:</Col>
                  <Col className="text-end">{fmtMoney(totals.shipping)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax:</Col>
                  <Col className="text-end">{fmtMoney(totals.tax)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col><strong>Total:</strong></Col>
                  <Col className="text-end"><strong>{fmtMoney(totals.total)}</strong></Col>
                </Row>
              </ListGroup.Item>

              {!order.isPaid && (
                <ListGroup.Item>
                  {loadingPay || !sdkReady ? (
                    <Loader />
                  ) : (
                    <PayPalButton
                      amount={Number(totals.total || 0).toFixed(2)}
                      onSuccess={successPaymentHandler}
                      onError={() => setError('PayPal payment failed. Please try again.')}
                      onCancel={() => {/* noop, user cancelled */}}
                    />
                  )}
                </ListGroup.Item>
              )}

              {loadingDeliver && (
                <ListGroup.Item><Loader /></ListGroup.Item>
              )}

              {isAdmin && order.isPaid && !order.isDelivered && (
                <ListGroup.Item>
                  <Button type="button" className="w-100" onClick={deliverHandler}>
                    Mark As Delivered
                  </Button>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      {/* Print styles */}
      <style>{`
        @media print {
          header, .btn, .PayPalButton, .paypal-button-container { display: none !important; }
          .card, .list-group-item { border: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
