import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Row, Col, ListGroup, Image, Card, Form, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance'; // keep your instance
import Message from '../Components/Message';
import CheckoutSteps from '../Components/CheckoutSteps';
import { setMeta } from '../lib/seo.js';

const toCents = (n) => Math.max(0, Math.round(Number(n || 0) * 100));
const fromCents = (c) => (Number(c || 0) / 100);
const fmtMoney = (cents) => {
  const n = fromCents(cents);
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n); }
  catch { return `$${n.toFixed(2)}`; }
};

export default function PlaceOrderScreen() {
  const navigate = useNavigate();
  const srTotalsRef = useRef(null);

  const [cart, setCart] = useState({
    cartItems: [],
    shippingAddress: {},
    paymentMethod: '',
  });

  const [shippingMethod, setShippingMethod] = useState(() => localStorage.getItem('shippingMethod') || 'standard'); // standard | express
  const [couponCode, setCouponCode] = useState(() => localStorage.getItem('couponCode') || '');
  const [couponApplied, setCouponApplied] = useState(null); // { code, discount_cents, freeship?:boolean }
  const [giftNote, setGiftNote] = useState(() => localStorage.getItem('giftNote') || '');
  const [orderNotes, setOrderNotes] = useState(() => localStorage.getItem('orderNotes') || '');
  const [agree, setAgree] = useState(false);

  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  // SEO
  useEffect(() => {
    setMeta({ title: 'Review Order – Vyshnavi Pelimelli', description: 'Review and place your order.' });
  }, []);

  // Load cart details from localStorage
  useEffect(() => {
    const storedCartItems = (() => { try { return JSON.parse(localStorage.getItem('cartItems') || '[]'); } catch { return []; }})();
    const storedShippingAddress = (() => { try { return JSON.parse(localStorage.getItem('shippingAddress') || '{}'); } catch { return {}; }})();
    const storedPaymentMethod = localStorage.getItem('paymentMethod') || '';

    setCart({
      cartItems: Array.isArray(storedCartItems) ? storedCartItems : [],
      shippingAddress: storedShippingAddress || {},
      paymentMethod: storedPaymentMethod || '',
    });
  }, []);

  // Guards
  useEffect(() => {
    if (!cart.shippingAddress?.address) navigate('/shipping');
  }, [cart.shippingAddress, navigate]);
  useEffect(() => {
    if (!cart.paymentMethod) navigate('/payment');
  }, [cart.paymentMethod, navigate]);

  // Price math (in cents; avoids floating errors)
  const math = useMemo(() => {
    const items_cents = (cart.cartItems || []).reduce((acc, it) => {
      const price_cents = it.price_cents != null ? Number(it.price_cents) : toCents(it.price);
      const qty = Number(it.qty || 1);
      return acc + price_cents * qty;
    }, 0);

    // Shipping base by method
    const baseShipping_cents = shippingMethod === 'express' ? toCents(25) : toCents(fromCents(items_cents) > 100 ? 0 : 10); // standard free > $100

    // Coupon scaffold
    let discount_cents = 0;
    let freeship = false;
    if (couponApplied?.code) {
      if (couponApplied.code === 'WELCOME10') {
        // 10% off items, cap $50
        const calc = Math.min(toCents(50), Math.round(items_cents * 0.10));
        discount_cents = calc;
      }
      if (couponApplied.code === 'FREESHIP') {
        freeship = true;
      }
    }

    // shipping after freeship
    const shipping_cents = freeship ? 0 : baseShipping_cents;

    // tax: 8.2% on (items - discount); simple model (adjust per your region)
    const taxable_cents = Math.max(0, items_cents - discount_cents);
    const tax_cents = Math.round(taxable_cents * 0.082);

    const total_cents = Math.max(0, taxable_cents + shipping_cents + tax_cents);

    return {
      items_cents,
      shipping_cents,
      tax_cents,
      discount_cents,
      total_cents,
      freeship,
    };
  }, [cart.cartItems, couponApplied, shippingMethod]);

  // Announce totals for a11y
  useEffect(() => {
    if (!srTotalsRef.current) return;
    srTotalsRef.current.textContent =
      `Items ${fmtMoney(math.items_cents)}, discount ${fmtMoney(math.discount_cents)}, shipping ${fmtMoney(math.shipping_cents)}, tax ${fmtMoney(math.tax_cents)}, total ${fmtMoney(math.total_cents)}.`;
  }, [math]);

  // Apply coupon (client hint; server should re-validate)
  const tryApplyCoupon = (e) => {
    e?.preventDefault?.();
    const code = String(couponCode || '').trim().toUpperCase();
    setError('');

    if (!code) { setCouponApplied(null); return; }

    // Simple demo rules; replace with server validation when available
    if (code === 'WELCOME10') {
      setCouponApplied({ code, discount_cents: 0 });
      localStorage.setItem('couponCode', code);
    } else if (code === 'FREESHIP') {
      setCouponApplied({ code, discount_cents: 0, freeship: true });
      localStorage.setItem('couponCode', code);
    } else {
      setCouponApplied(null);
      setError('Invalid coupon code.');
    }
  };

  // Persist small fields
  useEffect(() => { localStorage.setItem('shippingMethod', shippingMethod); }, [shippingMethod]);
  useEffect(() => { localStorage.setItem('giftNote', giftNote); }, [giftNote]);
  useEffect(() => { localStorage.setItem('orderNotes', orderNotes); }, [orderNotes]);

  const placeOrder = async () => {
    setError('');
    if (!cart.cartItems?.length) { setError('Your cart is empty.'); return; }
    if (!cart.shippingAddress?.address) { setError('Shipping address is missing.'); return; }
    if (!cart.paymentMethod) { setError('Payment method is missing.'); return; }
    if (!agree) { setError('Please accept the terms to continue.'); return; }

    try {
      setPlacing(true);
      const userInfo = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch { return null; }})();
      if (!userInfo) { navigate('/login'); return; }

      // Server still owns the truth; we send structured cents too.
      const payload = {
        orderItems: (cart.cartItems || []).map((it) => ({
          product: it.product || it.productId || it._id,
          name: it.name,
          image: it.image || it.image_path,
          qty: Number(it.qty || 1),
          price: it.price ?? fromCents(it.price_cents), // keep legacy for backend
          price_cents: it.price_cents != null ? Number(it.price_cents) : toCents(it.price),
          size: it.size || null,
          color: it.color || null,
          variantId: it.variantId || null,
        })),
        shippingAddress: cart.shippingAddress,
        paymentMethod: cart.paymentMethod,
        shippingMethod,
        couponCode: couponApplied?.code || '',
        discount_cents: math.discount_cents,
        itemsPrice: fromCents(math.items_cents).toFixed(2),
        shippingPrice: fromCents(math.shipping_cents).toFixed(2),
        taxPrice: fromCents(math.tax_cents).toFixed(2),
        totalPrice: fromCents(math.total_cents).toFixed(2),
        // Optional extras
        giftNote: giftNote || '',
        orderNotes: orderNotes || '',
      };

      const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axiosInstance.post('/api/orders/add/', payload, config);

      // Clear cart
      localStorage.removeItem('cartItems');
      // Keep shipping/coupon for convenience; remove if you prefer:
      // localStorage.removeItem('shippingAddress'); localStorage.removeItem('paymentMethod'); localStorage.removeItem('couponCode');

      // basic analytics hint
      try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'purchase_initiated', value: fromCents(math.total_cents) }); } catch {}

      // Navigate to order detail
      const oid = data?._id || data?.id;
      navigate(`/order/${oid}`);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'An error occurred while placing the order.');
    } finally {
      setPlacing(false);
    }
  };

  const totals = (
    <>
      <ListGroup.Item>
        <Row><Col>Items:</Col><Col className="text-end">{fmtMoney(math.items_cents)}</Col></Row>
      </ListGroup.Item>
      {math.discount_cents > 0 && (
        <ListGroup.Item className="text-success">
          <Row><Col>Discount{couponApplied?.code ? ` (${couponApplied.code})` : ''}:</Col><Col className="text-end">−{fmtMoney(math.discount_cents)}</Col></Row>
        </ListGroup.Item>
      )}
      <ListGroup.Item>
        <Row><Col>Shipping{couponApplied?.code === 'FREESHIP' ? ' (Free)' : shippingMethod === 'express' ? ' (Express)' : ' (Standard)'}:</Col><Col className="text-end">{fmtMoney(math.shipping_cents)}</Col></Row>
      </ListGroup.Item>
      <ListGroup.Item>
        <Row><Col>Tax:</Col><Col className="text-end">{fmtMoney(math.tax_cents)}</Col></Row>
      </ListGroup.Item>
      <ListGroup.Item>
        <Row><Col><strong>Total:</strong></Col><Col className="text-end"><strong>{fmtMoney(math.total_cents)}</strong></Col></Row>
      </ListGroup.Item>
    </>
  );

  return (
    <div>
      {/* A11y live totals */}
      <div className="visually-hidden" aria-live="polite" ref={srTotalsRef} />

      <CheckoutSteps step1 step2 step3 step4 />
      <Row>
        <Col md={8}>
          <ListGroup variant="flush">
            {/* Shipping */}
            <ListGroup.Item>
              <h2 className="h4">Shipping</h2>
              {!cart.shippingAddress?.address ? (
                <Message variant="warning" className="mb-0">
                  Missing shipping address. <Link to="/shipping">Add shipping</Link>
                </Message>
              ) : (
                <>
                  <div><strong>Name:</strong> {cart.shippingAddress.name || '—'}</div>
                  <div>
                    <strong>Address:</strong>{' '}
                    {[cart.shippingAddress.address, cart.shippingAddress.address2, cart.shippingAddress.city, cart.shippingAddress.region, cart.shippingAddress.postalCode, cart.shippingAddress.country]
                      .filter(Boolean).join(', ')}
                  </div>
                  <Form className="mt-3">
                    <Form.Label className="mb-2">Shipping method</Form.Label>
                    <div className="d-flex gap-3">
                      <Form.Check
                        id="ship-standard"
                        type="radio"
                        label="Standard"
                        name="ship"
                        checked={shippingMethod === 'standard'}
                        onChange={() => setShippingMethod('standard')}
                      />
                      <Form.Check
                        id="ship-express"
                        type="radio"
                        label="Express"
                        name="ship"
                        checked={shippingMethod === 'express'}
                        onChange={() => setShippingMethod('express')}
                      />
                    </div>
                  </Form>
                </>
              )}
            </ListGroup.Item>

            {/* Payment */}
            <ListGroup.Item>
              <h2 className="h4">Payment</h2>
              {!cart.paymentMethod ? (
                <Message variant="warning" className="mb-0">
                  No payment method selected. <Link to="/payment">Choose payment</Link>
                </Message>
              ) : (
                <div><strong>Method:</strong> {cart.paymentMethod}</div>
              )}
            </ListGroup.Item>

            {/* Items */}
            <ListGroup.Item>
              <h2 className="h4">Items</h2>
              {(!cart.cartItems || cart.cartItems.length === 0) ? (
                <Message variant="info">Your cart is empty</Message>
              ) : (
                <ListGroup variant="flush">
                  {cart.cartItems.map((item, index) => {
                    const price_cents = item.price_cents != null ? Number(item.price_cents) : toCents(item.price);
                    const line_cents = price_cents * Number(item.qty || 1);
                    return (
                      <ListGroup.Item key={`${item.product || item._id || index}-${index}`} className="py-3">
                        <Row className="align-items-center g-2">
                          <Col xs={2} md={1}>
                            <Image src={item.image || item.image_path} alt={item.name} fluid rounded />
                          </Col>
                          <Col>
                            <Link to={`/product/${item.product || item._id || ''}`} className="text-decoration-none">{item.name}</Link>
                            <div className="text-muted small">{[item.size, item.color].filter(Boolean).join(' · ')}</div>
                          </Col>
                          <Col md={4} className="text-md-end">
                            {item.qty} × {fmtMoney(price_cents)} = <strong>{fmtMoney(line_cents)}</strong>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              )}
            </ListGroup.Item>

            {/* Extras */}
            <ListGroup.Item>
              <h2 className="h5 mb-3">Extras</h2>
              <Form onSubmit={(e) => { e.preventDefault(); tryApplyCoupon(); }}>
                <Row className="g-2 align-items-center mb-2">
                  <Col xs={7} md={6}>
                    <Form.Control
                      placeholder="Coupon code (e.g., WELCOME10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                  </Col>
                  <Col xs="auto">
                    <Button variant="outline-dark" onClick={tryApplyCoupon}>Apply</Button>
                  </Col>
                  {couponApplied?.code && (
                    <Col xs="auto">
                      <span className="text-success small">Applied: {couponApplied.code}</span>
                    </Col>
                  )}
                </Row>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Gift note (optional)"
                      value={giftNote}
                      onChange={(e) => setGiftNote(e.target.value)}
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Order notes (delivery instructions, etc.)"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                    />
                  </Col>
                </Row>
              </Form>
            </ListGroup.Item>
          </ListGroup>
        </Col>

        {/* Summary */}
        <Col md={4}>
          <Card className="shadow-sm position-sticky" style={{ top: 12 }}>
            <ListGroup variant="flush">
              <ListGroup.Item><h2 className="h4 mb-0">Order Summary</h2></ListGroup.Item>
              {totals}
              <ListGroup.Item>
                {error && <Message variant="danger">{error}</Message>}
                <Form.Check
                  className="mt-2"
                  id="agree"
                  type="checkbox"
                  label={<>I agree to the <Link to="/terms">Terms</Link> and <Link to="/returns">Returns Policy</Link></>}
                  checked={agree}
                  onChange={(e) => setAgree(!!e.target.checked)}
                />
              </ListGroup.Item>
              <ListGroup.Item>
                <Button
                  type="button"
                  className="w-100"
                  disabled={placing || !cart.cartItems?.length || !cart.paymentMethod || !cart.shippingAddress?.address || !agree}
                  onClick={placeOrder}
                >
                  {placing ? 'Placing…' : 'Place Order'}
                </Button>
                <div className="text-muted small mt-2">
                  <i className="fas fa-lock me-1" aria-hidden="true" />
                  Secure checkout. You won’t be charged until payment is confirmed.
                </div>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
