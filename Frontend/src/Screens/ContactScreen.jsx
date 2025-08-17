import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { usePage } from '../hooks/usePage';
import { setMeta, preloadImage } from '../lib/seo.js';
import { listPress } from '../lib/pressClient';

function FieldError({ id, message }) {
  if (!message) return null;
  return <div id={id} className="text-danger small mt-1" role="alert">{message}</div>;
}

export default function ContactScreen() {
  const { page, loading, error } = usePage('contact');
  const [press, setPress] = useState([]);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General enquiry');
  const [preferred, setPreferred] = useState('email'); // email | phone
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [marketing, setMarketing] = useState(false);
  const [giftNote, setGiftNote] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  // Validation
  const [errors, setErrors] = useState({});
  const [errorSummary, setErrorSummary] = useState('');
  const summaryRef = useRef(null);

  // Simple anti-spam (honeypot + rate-limit)
  const [hp, setHp] = useState(''); // honeypot field (should remain empty)
  const RATE_LIMIT_SECONDS = 30;

  // SEO + preload
  useEffect(() => {
    const hero = page?.hero_url || null;
    const title = `${page?.title || 'Contact'} – Vyshnavi Pelimelli`;
    const desc = (page?.body_md || 'Get in touch with our studio.').slice(0, 140);
    setMeta({ title, description: desc, image: hero, type: 'article', canonical: window.location.href });
    if (hero) preloadImage(hero);
  }, [page]);

  // Press/stockists
  useEffect(() => {
    (async () => {
      const { items } = await listPress();
      setPress(items || []);
    })();
  }, []);

  // Derived preview for JSON-LD
  const preview = useMemo(() => (page?.body_md || 'Contact Vyshnavi Pelimelli').slice(0, 160), [page]);

  // JSON-LD (ContactPage + Organization with contactPoint)
  const jsonLd = useMemo(() => [
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: page?.title || 'Contact',
      description: preview,
      primaryImageOfPage: page?.hero_url || undefined
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Vyshnavi Pelimelli',
      url: window.location.origin,
      contactPoint: [{
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@example.com',
        areaServed: 'Worldwide',
        availableLanguage: ['en']
      }]
    }
  ], [page, preview]);

  function validate() {
    const next = {};
    if (!/.+@.+\..+/.test(String(email))) next.email = 'Enter a valid email';
    if (!String(name).trim()) next.name = 'Your name is required';
    if (!String(message).trim()) next.message = 'Please tell us a bit about your enquiry';
    if (preferred === 'phone' && !String(phone).trim()) next.phone = 'Phone is required for phone contact';
    setErrors(next);
    return next;
  }

  function onSubmit(e) {
    e.preventDefault();
    setErrorSummary('');
    if (hp) return; // honeypot filled → silently ignore

    // Rate-limit
    const last = Number(localStorage.getItem('contact_last_sent_at') || 0);
    const now = Date.now();
    if (last && (now - last) / 1000 < RATE_LIMIT_SECONDS) {
      const remain = Math.ceil(RATE_LIMIT_SECONDS - (now - last) / 1000);
      setErrorSummary(`Please wait ${remain}s before sending another message.`);
      summaryRef.current?.focus();
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrorSummary('Please fix the errors below and try again.');
      summaryRef.current?.focus();
      return;
    }

    setSending(true);
    // Simulate send; in production, POST to your backend or Supabase function.
    setTimeout(() => {
      setSending(false);
      setSent(true);
      localStorage.setItem('contact_last_sent_at', String(Date.now()));
      // Persist a copy for your admin view, if needed
      try {
        const record = { name, email, phone, subject, preferred, message, marketing, giftNote, ts: new Date().toISOString() };
        const prev = JSON.parse(localStorage.getItem('contact_submissions') || '[]');
        prev.push(record);
        localStorage.setItem('contact_submissions', JSON.stringify(prev));
      } catch {}

      // Reset form
      setName(''); setEmail(''); setPhone(''); setMessage(''); setGiftNote(''); setMarketing(false);
    }, 700);
  }

  // Helper input renderer
  const fieldErrorId = (key) => `contact-${key}-error`;

  return (
    <main id="main">
      <Container className="mt-3">
        {/* Hero (if available) */}
        {page?.hero_url && (
          <section className="mb-3" aria-label="Contact hero">
            <div className="position-relative aspect-169 overflow-hidden rounded-2">
              <picture>
                <source srcSet={page.hero_url.replace(/\.[^.]+$/, '.avif')} type="image/avif" />
                <source srcSet={page.hero_url.replace(/\.[^.]+$/, '.webp')} type="image/webp" />
                <img
                  src={page.hero_url}
                  alt={page?.title || 'Contact'}
                  width="2400" height="1350" decoding="async"
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
                />
              </picture>
              <div className="position-absolute bottom-0 start-0 end-0 p-3 p-md-5"
                   style={{ background:'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.45) 100%)' }}>
                <h1 className="text-white" style={{ fontFamily:'Playfair Display, serif', fontSize:'clamp(2rem,4vw,3rem)' }}>
                  {page?.title || 'Contact'}
                </h1>
                <p className="text-white-50 mb-0" style={{ maxWidth: 720 }}>
                  We’d love to hear from you. Book an appointment or send us a message.
                </p>
              </div>
            </div>
          </section>
        )}

        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : !page ? (
          <Message variant="info">Contact page is not published yet.</Message>
        ) : (
          <Row className="g-4">
            {/* ===== Left: Form ===== */}
            <Col md={7}>
              {/* Summary error (focus target) */}
              {errorSummary && (
                <div ref={summaryRef} tabIndex={-1} className="alert alert-danger" role="alert" aria-live="assertive">
                  {errorSummary}
                </div>
              )}

              {sent && <Alert variant="success">Thanks for reaching out. We’ll reply soon.</Alert>}

              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title className="mb-2" style={{ fontFamily:'Playfair Display, serif' }}>Send us a message</Card.Title>
                  <div className="text-muted small mb-3">
                    For bespoke pieces, select “Bespoke & fittings”. We aim to respond within 2 business days.
                  </div>
                  <Form noValidate onSubmit={onSubmit}>
                    {/* Honeypot (visually hidden) */}
                    <input type="text" value={hp} onChange={(e)=>setHp(e.target.value)} autoComplete="off" tabIndex="-1" aria-hidden="true"
                      style={{ position:'absolute', left:'-9999px', width:1, height:1, opacity:0 }} />

                    <Form.Group className="mb-3" controlId="contact-name">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text" value={name}
                        onChange={(e)=>{ setName(e.target.value); setErrors((er)=>({ ...er, name:'' })); }}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? fieldErrorId('name') : undefined}
                        placeholder="Your name" autoComplete="name" required
                      />
                      <FieldError id={fieldErrorId('name')} message={errors.name} />
                    </Form.Group>

                    <Row>
                      <Col md={7}>
                        <Form.Group className="mb-3" controlId="contact-email">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email" value={email}
                            onChange={(e)=>{ setEmail(e.target.value); setErrors((er)=>({ ...er, email:'' })); }}
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? fieldErrorId('email') : undefined}
                            placeholder="you@example.com" autoComplete="email" required
                          />
                          <FieldError id={fieldErrorId('email')} message={errors.email} />
                        </Form.Group>
                      </Col>
                      <Col md={5}>
                        <Form.Group className="mb-3" controlId="contact-preferred">
                          <Form.Label>Preferred contact</Form.Label>
                          <Form.Select value={preferred} onChange={(e)=>setPreferred(e.target.value)} aria-label="Preferred contact method">
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    {preferred === 'phone' && (
                      <Form.Group className="mb-3" controlId="contact-phone">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                          type="tel" value={phone}
                          onChange={(e)=>{ setPhone(e.target.value); setErrors((er)=>({ ...er, phone:'' })); }}
                          aria-invalid={!!errors.phone}
                          aria-describedby={errors.phone ? fieldErrorId('phone') : undefined}
                          placeholder="+1 555 555 5555" autoComplete="tel"
                          required
                        />
                        <FieldError id={fieldErrorId('phone')} message={errors.phone} />
                      </Form.Group>
                    )}

                    <Row>
                      <Col md={7}>
                        <Form.Group className="mb-3" controlId="contact-subject">
                          <Form.Label>Subject</Form.Label>
                          <Form.Select value={subject} onChange={(e)=>setSubject(e.target.value)} aria-label="Message subject">
                            <option>General enquiry</option>
                            <option>Bespoke & fittings</option>
                            <option>Order support</option>
                            <option>Press & partnerships</option>
                            <option>Stockists</option>
                            <option>Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={5}>
                        <Form.Check
                          id="marketing-opt"
                          className="mt-4"
                          type="checkbox"
                          label="Email me about new collections"
                          checked={marketing}
                          onChange={(e)=>setMarketing(!!e.target.checked)}
                        />
                      </Col>
                    </Row>

                    <Form.Group className="mb-3" controlId="contact-message">
                      <Form.Label>Message</Form.Label>
                      <Form.Control
                        as="textarea" rows={5} value={message}
                        onChange={(e)=>{ setMessage(e.target.value); setErrors((er)=>({ ...er, message:'' })); }}
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? fieldErrorId('message') : undefined}
                        placeholder="How can we help?" required
                      />
                      <FieldError id={fieldErrorId('message')} message={errors.message} />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="contact-gift-note">
                      <Form.Label>Notes (optional)</Form.Label>
                      <Form.Control
                        as="textarea" rows={3} value={giftNote}
                        onChange={(e)=>setGiftNote(e.target.value)}
                        placeholder="Gift message, appointment preferences, or additional context"
                      />
                    </Form.Group>

                    <div className="d-flex align-items-center justify-content-between">
                      <div className="text-muted small">
                        We rate-limit submissions to prevent spam.
                      </div>
                      <Button type="submit" variant="dark" className="rounded-1 px-4" disabled={sending}>
                        {sending ? 'Sending…' : 'Send'}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* ===== Right: Stockists / Hours / Studio ===== */}
            <Col md={5}>
              {page?.hero_url && (
                <div className="rounded-2 overflow-hidden aspect-169 mb-3">
                  <picture>
                    <source srcSet={page.hero_url.replace(/\.[^.]+$/, '.avif')} type="image/avif" />
                    <source srcSet={page.hero_url.replace(/\.[^.]+$/, '.webp')} type="image/webp" />
                    <img
                      src={page.hero_url}
                      alt={page?.title || 'Contact'}
                      width="1200" height="675" loading="lazy" decoding="async"
                      style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
                    />
                  </picture>
                </div>
              )}

              <Card className="shadow-sm mb-3 lazy-section">
                <Card.Body>
                  <Card.Title>Stockists & Press</Card.Title>
                  <div className="text-muted small mb-2">Selected partners</div>
                  <div className="d-flex flex-wrap gap-3 align-items-center" style={{ filter:'grayscale(1)', opacity:0.85 }}>
                    {(press || []).slice(0, 8).map((p) => (
                      <div key={p.id} className="d-inline-flex align-items-center" style={{ height: 32 }}>
                        {p.hero_url ? (
                          <img src={p.hero_url} alt={p.title} width="96" height="32" style={{ objectFit:'contain', maxHeight: 32, maxWidth: 96 }} />
                        ) : (
                          <span className="text-muted small">{p.title}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm mb-3 lazy-section">
                <Card.Body>
                  <Card.Title>Hours & Studio</Card.Title>
                  <div className="small">
                    <div className="d-flex justify-content-between"><span>Mon–Fri</span><span>10:00 – 18:00</span></div>
                    <div className="d-flex justify-content-between"><span>Sat</span><span>11:00 – 16:00</span></div>
                    <div className="d-flex justify-content-between"><span>Sun</span><span>Closed</span></div>
                  </div>
                  <hr />
                  <div className="small text-muted">
                    Visits by appointment. For bespoke fittings, choose <em>Bespoke & fittings</em> above.
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm lazy-section">
                <Card.Body>
                  <Card.Title>Social</Card.Title>
                  <div className="d-flex gap-3">
                    <a className="text-reset" href="#" aria-label="Instagram">
                      <i className="fab fa-instagram" aria-hidden="true" /> Instagram
                    </a>
                    <a className="text-reset" href="#" aria-label="Pinterest">
                      <i className="fab fa-pinterest" aria-hidden="true" /> Pinterest
                    </a>
                    <a className="text-reset" href="#" aria-label="TikTok">
                      <i className="fab fa-tiktok" aria-hidden="true" /> TikTok
                    </a>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd, null, 0) }} />
    </main>
  );
}
