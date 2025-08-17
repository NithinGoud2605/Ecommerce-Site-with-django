import React, { useEffect, useMemo, useState } from 'react';
import { Form, Button, Row, Col, FloatingLabel } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import FormContainer from '../Components/FormContainer';
import CheckoutSteps from '../Components/CheckoutSteps';
import { setMeta } from '../lib/seo.js';

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'OTHER', name: 'Other' },
];

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <div id={id} className="text-danger small mt-1" role="alert" aria-live="assertive">
      {message}
    </div>
  );
}

export default function ShippingScreen() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState(''); // state/province/region
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');
  const [phone, setPhone] = useState('');

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMeta({ title: 'Shipping – Vyshnavi Pelimelli', description: 'Enter your shipping information.' });
  }, []);

  // Restore from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('shippingAddress') || '{}');
      setFullName(saved.fullName || saved.name || '');
      setAddress1(saved.address1 || saved.address || '');
      setAddress2(saved.address2 || '');
      setCity(saved.city || '');
      setRegion(saved.region || saved.state || '');
      setPostalCode(saved.postalCode || saved.postal || '');
      setCountry(saved.country || 'US');
      setPhone(saved.phone || '');
    } catch {}
  }, []);

  // Autosave as user types (debounced by React batching)
  useEffect(() => {
    const payload = {
      fullName,
      address: address1,        // keep legacy keys for compatibility
      address1,
      address2,
      city,
      region,
      postalCode,
      country,
      phone,
    };
    localStorage.setItem('shippingAddress', JSON.stringify(payload));
  }, [fullName, address1, address2, city, region, postalCode, country, phone]);

  const isUS = useMemo(() => country === 'US', [country]);
  const isGB = useMemo(() => country === 'GB', [country]);
  const isCA = useMemo(() => country === 'CA', [country]);

  function validate() {
    const next = {};
    if (!fullName.trim()) next.fullName = 'Full name is required';
    if (!address1.trim()) next.address1 = 'Address line 1 is required';
    if (!city.trim()) next.city = 'City is required';
    if (!region.trim()) next.region = isUS ? 'State is required' : 'Region/State is required';
    if (!postalCode.trim()) {
      next.postalCode = 'Postal code is required';
    } else {
      // Basic patterns for a few locales; accept others
      const zipUS = /^\d{5}(-\d{4})?$/;
      const postCA = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
      const postGB = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/;
      if (isUS && !zipUS.test(postalCode.trim())) next.postalCode = 'Enter a valid ZIP (e.g., 94105)';
      if (isCA && !postCA.test(postalCode.trim())) next.postalCode = 'Enter a valid Canadian code (e.g., M5V 2T6)';
      if (isGB && !postGB.test(postalCode.trim())) next.postalCode = 'Enter a valid UK postcode (e.g., SW1A 1AA)';
    }
    if (!country) next.country = 'Country is required';
    if (phone && !/^[+()\d\s\-]{7,}$/.test(phone)) next.phone = 'Enter a valid phone (optional)';
    return next;
  }

  const canContinue = useMemo(() => {
    const v = validate();
    return Object.keys(v).length === 0;
  }, [fullName, address1, city, region, postalCode, country, phone]);

  function onSubmit(e) {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;
    setSubmitting(true);
    // data already persisted to localStorage; continue to Payment
    navigate('/payment');
  }

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 />
      <h1>Shipping</h1>

      <Form noValidate onSubmit={onSubmit}>
        <FloatingLabel controlId="ship-fullname" label="Full name" className="mb-3">
          <Form.Control
            type="text"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); setErrors((x)=>({ ...x, fullName: '' })); }}
            placeholder="Your full name"
            autoComplete="name"
            aria-describedby={errors.fullName ? 'ship-fullname-error' : undefined}
            aria-invalid={!!errors.fullName}
            required
          />
        </FloatingLabel>
        <FieldError id="ship-fullname-error" message={errors.fullName} />

        <FloatingLabel controlId="ship-address1" label="Address line 1" className="mb-3">
          <Form.Control
            type="text"
            value={address1}
            onChange={(e) => { setAddress1(e.target.value); setErrors((x)=>({ ...x, address1: '' })); }}
            placeholder="Street address, P.O. box, company name"
            autoComplete="address-line1"
            aria-describedby={errors.address1 ? 'ship-address1-error' : undefined}
            aria-invalid={!!errors.address1}
            required
          />
        </FloatingLabel>
        <FieldError id="ship-address1-error" message={errors.address1} />

        <FloatingLabel controlId="ship-address2" label="Address line 2 (optional)" className="mb-3">
          <Form.Control
            type="text"
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
            placeholder="Apartment, suite, unit, building, floor, etc."
            autoComplete="address-line2"
          />
        </FloatingLabel>

        <Row>
          <Col md={5} className="mb-3">
            <FloatingLabel controlId="ship-city" label="City">
              <Form.Control
                type="text"
                value={city}
                onChange={(e) => { setCity(e.target.value); setErrors((x)=>({ ...x, city: '' })); }}
                placeholder="City"
                autoComplete="address-level2"
                aria-describedby={errors.city ? 'ship-city-error' : undefined}
                aria-invalid={!!errors.city}
                required
              />
            </FloatingLabel>
            <FieldError id="ship-city-error" message={errors.city} />
          </Col>
          <Col md={3} className="mb-3">
            <FloatingLabel controlId="ship-region" label={isUS ? 'State' : 'Region/State'}>
              <Form.Control
                type="text"
                value={region}
                onChange={(e) => { setRegion(e.target.value); setErrors((x)=>({ ...x, region: '' })); }}
                placeholder="State/Region"
                autoComplete="address-level1"
                aria-describedby={errors.region ? 'ship-region-error' : undefined}
                aria-invalid={!!errors.region}
                required
              />
            </FloatingLabel>
            <FieldError id="ship-region-error" message={errors.region} />
          </Col>
          <Col md={4} className="mb-3">
            <FloatingLabel controlId="ship-postal" label="Postal code">
              <Form.Control
                type="text"
                value={postalCode}
                onChange={(e) => { setPostalCode(e.target.value); setErrors((x)=>({ ...x, postalCode: '' })); }}
                placeholder="ZIP / Postal code"
                autoComplete="postal-code"
                aria-describedby={errors.postalCode ? 'ship-postal-error' : undefined}
                aria-invalid={!!errors.postalCode}
                required
              />
            </FloatingLabel>
            <FieldError id="ship-postal-error" message={errors.postalCode} />
          </Col>
        </Row>

        <Row>
          <Col md={6} className="mb-3">
            <FloatingLabel controlId="ship-country" label="Country">
              <Form.Select
                value={country}
                onChange={(e) => { setCountry(e.target.value); setErrors((x)=>({ ...x, country: '' })); }}
                autoComplete="country-name"
                aria-describedby={errors.country ? 'ship-country-error' : undefined}
                aria-invalid={!!errors.country}
                required
              >
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </Form.Select>
            </FloatingLabel>
            <FieldError id="ship-country-error" message={errors.country} />
          </Col>
          <Col md={6} className="mb-3">
            <FloatingLabel controlId="ship-phone" label="Phone (for delivery updates)">
              <Form.Control
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrors((x)=>({ ...x, phone: '' })); }}
                placeholder="+1 415 555 0132"
                autoComplete="tel"
                aria-describedby={errors.phone ? 'ship-phone-error' : undefined}
                aria-invalid={!!errors.phone}
              />
            </FloatingLabel>
            <FieldError id="ship-phone-error" message={errors.phone} />
          </Col>
        </Row>

        <div className="d-flex justify-content-between align-items-center mt-2">
          <Link to="/cart" className="text-muted">Back to Cart</Link>
          <Button
            type="submit"
            variant="primary"
            disabled={!canContinue || submitting}
            style={{ transition: 'transform 160ms ease' }}
            onMouseDown={(e)=>{ if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) e.currentTarget.style.transform='scale(0.98)'; }}
            onMouseUp={(e)=>{ e.currentTarget.style.transform='scale(1)'; }}
          >
            {submitting ? 'Continuing…' : 'Continue to Payment'}
          </Button>
        </div>
      </Form>
    </FormContainer>
  );
}
