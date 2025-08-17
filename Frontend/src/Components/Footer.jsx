// Footer.js
import React, { useMemo, useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { Instagram } from 'lucide-react';

function Footer() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const emailValid = useMemo(() => /.+@.+\..+/.test(String(email).trim()), [email]);
  const onSubmit = (e) => {
    e.preventDefault();
    setSuccess(false);
    if (!emailValid) { setError('Enter a valid email'); return; }
    setError('');
    setSuccess(true);
    setEmail('');
  };
  return (
    <footer className="custom-footer" style={{ background: '#111', color: '#eee' }}>
      <Container>
        <Row className="py-4 align-items-center">
          <Col md={5} className="mb-3 mb-md-0">
            <h5 className="footer-brand">Vyshnavi Pelimelli</h5>
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>Join our newsletter. We respect your privacy.</div>
          </Col>
          <Col md={4} className="mb-3 mb-md-0">
            <Form onSubmit={onSubmit} className="d-flex" noValidate>
              <Form.Control
                type="email"
                placeholder="Email address"
                aria-invalid={!!error}
                aria-describedby={error ? 'newsletter-error' : undefined}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); setSuccess(false); }}
                required
              />
              <Button type="submit" className="ms-2" variant="light">Sign up</Button>
            </Form>
            <div id="newsletter-error" className="text-danger small mt-1" role="alert" aria-live="polite">{error}</div>
            {success && <div className="text-success small mt-1" role="status" aria-live="polite">Thanks for subscribing.</div>}
          </Col>
          <Col md={3} className="d-flex justify-content-md-end gap-3">
            <a href="#" aria-label="Instagram" className="text-decoration-none" style={{ color: '#eee' }}><Instagram size={18} /></a>
            <a href="#" aria-label="Pinterest" className="text-decoration-none" style={{ color: '#eee' }}>Pi</a>
          </Col>
        </Row>
        <Row className="py-3 border-top border-secondary" style={{ fontSize: '0.9rem' }}>
          <Col md={6} className="mb-2">© {new Date().getFullYear()} Vyshnavi Pelimelli</Col>
          <Col md={6} className="d-flex gap-3 justify-content-md-end">
            <a href="#" className="text-decoration-none" style={{ color: '#eee' }}>Press</a>
            <a href="#" className="text-decoration-none" style={{ color: '#eee' }}>Stockists</a>
            <a href="#" className="text-decoration-none" style={{ color: '#eee' }}>Terms</a>
            <a href="#" className="text-decoration-none" style={{ color: '#eee' }}>Privacy</a>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;
