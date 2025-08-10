import React, { useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Row, FloatingLabel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import CheckoutSteps from '../Components/CheckoutSteps';
import { useCheckoutState } from '../hooks/useCheckoutState';
import { PAYPAL_ENABLED } from '../config/flags.ts';
import { useCart } from '../state/cartStore.jsx';
import { formatMoney } from '../utils/money.js';
import { setMeta } from '../lib/seo.js';

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <div id={id} className="text-danger small mt-1" role="alert">{message}</div>
  );
}

export default function CheckoutScreen() {
  const { state, setStep, updateContact, updateShipping } = useCheckoutState();
  const [errors, setErrors] = useState({});
  const { items, subtotal_cents } = useCart();

  useEffect(() => {
    // Ensure we start at step indicated by stored state
    setStep(Math.min(Math.max(Number(state.step) || 0, 0), 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMeta({ title: 'Checkout – Handmade Hub', description: 'Complete your order securely.' });
  }, []);

  const contactValid = useMemo(() => {
    const email = String(state.contact.email || '').trim();
    if (!email) return false;
    // naive email check
    return /.+@.+\..+/.test(email);
  }, [state.contact.email]);

  const shippingValid = useMemo(() => {
    const s = state.shipping || {};
    return (
      String(s.name || '').trim() &&
      String(s.address || '').trim() &&
      String(s.city || '').trim() &&
      String(s.region || '').trim() &&
      String(s.postal || '').trim() &&
      String(s.country || '').trim() &&
      String(s.phone || '').trim()
    );
  }, [state.shipping]);

  function goNext() {
    if (state.step === 0) {
      if (!contactValid) {
        setErrors((e) => ({ ...e, email: 'Valid email is required' }));
        return;
      }
      setStep(1);
    } else if (state.step === 1) {
      if (!shippingValid) {
        const s = state.shipping || {};
        const nextErrors = {
          name: !String(s.name || '').trim() ? 'Required' : '',
          address: !String(s.address || '').trim() ? 'Required' : '',
          city: !String(s.city || '').trim() ? 'Required' : '',
          region: !String(s.region || '').trim() ? 'Required' : '',
          postal: !String(s.postal || '').trim() ? 'Required' : '',
          country: !String(s.country || '').trim() ? 'Required' : '',
          phone: !String(s.phone || '').trim() ? 'Required' : '',
        };
        setErrors((e) => ({ ...e, ...nextErrors }));
        return;
      }
      setStep(2);
    }
  }

  function contactForm() {
    const id = 'checkout-email';
    return (
      <Form noValidate>
        <FloatingLabel controlId={id} label="Email" className="mb-3">
          <Form.Control
            type="email"
            value={state.contact.email}
            onChange={(e) => { updateContact({ email: e.target.value }); setErrors((er) => ({ ...er, email: '' })); }}
            aria-describedby={errors.email ? `${id}-error` : undefined}
            aria-invalid={!!errors.email}
            placeholder="email@example.com"
            autoComplete="email"
            required
          />
        </FloatingLabel>
        <FieldError id={`${id}-error`} message={errors.email} />
        <div className='d-flex justify-content-between'>
          <Link to='/cart'>Back to Cart</Link>
          <Button variant="primary" onClick={goNext} disabled={!contactValid}>Continue to Shipping</Button>
        </div>
      </Form>
    );
  }

  function shippingForm() {
    const s = state.shipping;
    const field = (key, label, type = 'text', required = true, placeholder='', autoComplete='') => {
      const id = `shipping-${key}`;
      const hasError = !!errors[key];
      return (
        <>
          <FloatingLabel controlId={id} label={label} className="mb-3">
            <Form.Control
              type={type}
              value={s[key]}
              onChange={(e) => { updateShipping({ [key]: e.target.value }); setErrors((er) => ({ ...er, [key]: '' })); }}
              aria-describedby={hasError ? `${id}-error` : undefined}
              aria-invalid={hasError}
              placeholder={placeholder || label}
              autoComplete={autoComplete || undefined}
              required={required}
            />
          </FloatingLabel>
          <FieldError id={`${id}-error`} message={errors[key]} />
        </>
      );
    };

    return (
      <Form noValidate>
        {field('name', 'Full Name', 'text', true, '', 'name')}
        {field('address', 'Address line 1', 'text', true, '', 'address-line1')}
        {field('address2', 'Address line 2', 'text', false, '', 'address-line2')}
        <Row>
          <Col md={6}>{field('city', 'City', 'text', true, '', 'address-level2')}</Col>
          <Col md={3}>{field('region', 'State/Region', 'text', true, '', 'address-level1')}</Col>
          <Col md={3}>{field('postal', 'Postal Code', 'text', true, '', 'postal-code')}</Col>
        </Row>
        {field('country', 'Country', 'text', true, '', 'country-name')}
        {field('phone', 'Phone', 'tel', true, '', 'tel')}
        <div className="d-flex justify-content-between gap-2">
          <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
          <Button variant="primary" onClick={goNext} disabled={!shippingValid} style={{ transition: 'transform 160ms ease' }} onMouseDown={(e)=>{ if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) e.currentTarget.style.transform='scale(0.98)'; }} onMouseUp={(e)=>{ e.currentTarget.style.transform='scale(1)'; }}>Continue to Review</Button>
        </div>
      </Form>
    );
  }

  function reviewStep() {
    return (
      <div>
        <h5 className='mb-3'>Review</h5>
        <div className='mb-3'>
          <div className='fw-semibold'>Contact</div>
          <div>{state.contact.email}</div>
        </div>
        <div className='mb-3'>
          <div className='fw-semibold'>Shipping</div>
          <div>
            {state.shipping.name}<br/>
            {state.shipping.address} {state.shipping.address2}<br/>
            {state.shipping.city}, {state.shipping.region} {state.shipping.postal}<br/>
            {state.shipping.country}
          </div>
        </div>
        <div className='mb-3'>
          <div className='fw-semibold'>Items</div>
          {items.map((it) => (
            <div key={it.variantId} className='d-flex justify-content-between small'>
              <div>{it.name} × {it.qty}</div>
              <div>{formatMoney({ amount_cents: it.qty * it.price_cents })}</div>
            </div>
          ))}
          <div className='d-flex justify-content-between mt-2'><strong>Subtotal</strong><strong>{formatMoney({ amount_cents: subtotal_cents })}</strong></div>
        </div>
        <div className='d-flex justify-content-between gap-2'>
          <Button variant='secondary' onClick={() => setStep(1)}>Back</Button>
          <Button variant='primary' onClick={() => { window.location.hash = '#/checkout/success'; }}>Place Order</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CheckoutSteps current={state.step} />
      <h1>Checkout</h1>
      {state.step === 0 && contactForm()}
      {state.step === 1 && shippingForm()}
      {state.step === 2 && reviewStep()}
    </div>
  );
}


