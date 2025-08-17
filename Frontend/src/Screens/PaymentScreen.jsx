import React, { useEffect, useMemo, useState } from 'react';
import { Form, Button, Col, Row, Card, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import FormContainer from '../Components/FormContainer';        // fixed casing
import CheckoutSteps from '../Components/CheckoutSteps';        // fixed casing
import { setMeta } from '../lib/seo.js';
import { PAYPAL_ENABLED } from '../config/flags.ts';            // existing flag in your repo

// Env-based Stripe toggle (safe even if no flag export exists)
const STRIPE_ENABLED = String(import.meta.env.VITE_STRIPE_ENABLED || '').toLowerCase() === 'true';
// Optional COD via env
const COD_ENABLED = String(import.meta.env.VITE_COD_ENABLED || '').toLowerCase() === 'true';

export default function PaymentScreen() {
  const navigate = useNavigate();
  const shippingAddress = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('shippingAddress') || 'null'); } catch { return null; }
  }, []);

  const [paymentMethod, setPaymentMethod] = useState(() => {
    return localStorage.getItem('paymentMethod') || (PAYPAL_ENABLED ? 'PayPal' : (STRIPE_ENABLED ? 'Stripe' : ''));
  });
  const [error, setError] = useState('');

  // Wallet (Payment Request API) soft detection for UX hint
  const walletHint = useMemo(() => {
    const pr = typeof window !== 'undefined' && 'PaymentRequest' in window;
    // We only show a hint; actual wallet is wired on Place Order / Stripe page
    return pr && STRIPE_ENABLED;
  }, []);

  useEffect(() => {
    if (!shippingAddress || !shippingAddress.address) {
      navigate('/shipping');
    }
  }, [navigate, shippingAddress]);

  useEffect(() => {
    setMeta({ title: 'Payment – Vyshnavi Pelimelli', description: 'Select your payment method.' });
  }, []);

  const METHODS = useMemo(() => ([
    {
      key: 'PayPal',
      label: 'PayPal',
      enabled: !!PAYPAL_ENABLED,
      desc: 'Pay with PayPal balance or cards in your PayPal wallet.',
      icon: <i className="fab fa-paypal me-2" aria-hidden="true" />,
    },
    {
      key: 'Stripe',
      label: 'Credit / Debit Card',
      enabled: !!STRIPE_ENABLED,
      desc: 'Secure card checkout (Visa, Mastercard, AmEx) powered by Stripe.',
      icon: <i className="far fa-credit-card me-2" aria-hidden="true" />,
    },
    {
      key: 'COD',
      label: 'Cash on Delivery',
      enabled: !!COD_ENABLED,
      desc: 'Pay when the order arrives (available in selected regions).',
      icon: <i className="fas fa-truck me-2" aria-hidden="true" />,
    },
  ]), []);

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!paymentMethod) {
      setError('Please select a payment method to continue.');
      return;
    }
    const chosen = METHODS.find(m => m.key === paymentMethod);
    if (!chosen || !chosen.enabled) {
      setError('Selected payment method is not available right now.');
      return;
    }
    localStorage.setItem('paymentMethod', paymentMethod);
    navigate('/placeorder');
  };

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 step3 />
      <header className="d-flex justify-content-between align-items-end mb-2">
        <div>
          <h2 className="mb-0" style={{ fontFamily: 'Playfair Display, serif' }}>Payment Method</h2>
          <div className="text-muted small">Choose how you want to pay at checkout.</div>
        </div>
        <Link to="/shipping" className="small">Back to Shipping</Link>
      </header>

      {walletHint && (
        <Alert variant="light" className="border-0">
          <i className="fas fa-bolt me-2" aria-hidden="true" />
          Tip: Your browser supports express wallets. On the next step you might see Apple Pay / Google Pay.
        </Alert>
      )}

      {error && <Alert variant="danger" role="alert">{error}</Alert>}

      <Form onSubmit={onSubmit} noValidate>
        <Form.Label as="legend" className="mb-2">Select Method</Form.Label>

        <Row xs={1} md={3} className="g-3 mb-3">
          {METHODS.map((m) => (
            <Col key={m.key}>
              <Card
                role="radio"
                aria-checked={paymentMethod === m.key}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (m.enabled) setPaymentMethod(m.key); } }}
                onClick={() => { if (m.enabled) setPaymentMethod(m.key); }}
                className={`h-100 ${paymentMethod === m.key ? 'border-dark' : ''} ${!m.enabled ? 'opacity-50' : ''}`}
                style={{ cursor: m.enabled ? 'pointer' : 'not-allowed', borderWidth: paymentMethod === m.key ? 2 : 1 }}
              >
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      {m.icon}
                      <Card.Title as="h3" className="h6 mb-0">{m.label}</Card.Title>
                    </div>
                    <Form.Check
                      type="radio"
                      name="paymentMethod"
                      id={`pm-${m.key}`}
                      checked={paymentMethod === m.key}
                      onChange={() => setPaymentMethod(m.key)}
                      disabled={!m.enabled}
                      aria-label={m.label}
                    />
                  </div>
                  <Card.Text className="text-muted small mt-2 mb-0" style={{ minHeight: 40 }}>
                    {m.desc}
                  </Card.Text>
                  {!m.enabled && (
                    <div className="text-muted small mt-2">
                      Currently unavailable.
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="d-flex align-items-center justify-content-between">
          <div className="text-muted small">
            <i className="fas fa-lock me-1" aria-hidden="true" />
            Your payment is encrypted and processed securely.
          </div>
          <Button
            type="submit"
            variant="dark"
            className="rounded-1"
            onMouseDown={(e)=>{ const r = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; if(!r) e.currentTarget.style.transform='scale(0.98)'; }}
            onMouseUp={(e)=>{ e.currentTarget.style.transform='scale(1)'; }}
          >
            Continue
          </Button>
        </div>
      </Form>
    </FormContainer>
  );
}
