import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import FormContainer from '../Components/FormContainer'; // NOTE: fixed path casing
import Loader from '../Components/Loader';
import { useAuth } from '../hooks/useAuth';
import { setMeta } from '../lib/seo.js';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [keep, setKeep] = useState(() => localStorage.getItem('auth_keep') === '1');
  const [capsOn, setCapsOn] = useState(false);

  // a11y error summary focus target
  const [localError, setLocalError] = useState('');
  const summaryRef = useRef(null);

  const { user, loading, error, signIn, signInWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = useMemo(
    () => (location.search ? location.search.split('=')[1] : '/'),
    [location.search]
  );

  useEffect(() => {
    if (user) navigate(redirect);
  }, [user, navigate, redirect]);

  useEffect(() => {
    setMeta({ title: 'Sign In – Vyshnavi Pelimelli', description: 'Access your atelier account.' });
  }, []);

  useEffect(() => {
    if (error) {
      setLocalError(error);
      summaryRef.current?.focus();
    }
  }, [error]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!/.+@.+\..+/.test(String(email))) {
      setLocalError('Please enter a valid email address.');
      summaryRef.current?.focus();
      return;
    }
    try {
      localStorage.setItem('auth_keep', keep ? '1' : '0');
      const { error: err } = await signIn(email.trim(), password);
      if (err) throw err;
      const origin = window.location.origin;
      const path = redirect.startsWith('/') ? redirect : `/${redirect}`;
      window.location.replace(`${origin}/#${path}`);
    } catch (err) {
      setLocalError(err?.message || 'Unable to sign in. Please try again.');
      summaryRef.current?.focus();
    }
  };

  const onPwKeyUp = (e) => {
    try {
      setCapsOn(e.getModifierState && e.getModifierState('CapsLock'));
    } catch {
      setCapsOn(false);
    }
  };

  const hasSocial = typeof signInWithProvider === 'function';

  return (
    <FormContainer>
      <main aria-labelledby="signin-heading">
        <h1 id="signin-heading" className="mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          Sign In
        </h1>
        <p className="text-muted mb-3">Welcome back — let’s get you into your account.</p>

        {/* Error summary (focusable) */}
        {(localError) && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            className="alert alert-danger"
            role="alert"
            aria-live="assertive"
          >
            {localError}
          </div>
        )}

        {loading && <Loader />}

        {/* Card: Email + password */}
        <Card className="shadow-sm">
          <Card.Body>
            <Form onSubmit={submitHandler} noValidate>
              {/* Email */}
              <Form.Group controlId="email" className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  aria-describedby="email-help"
                />
                <div id="email-help" className="visually-hidden">
                  Enter the email associated with your account
                </div>
              </Form.Group>

              {/* Password with show/hide & CapsLock hint */}
              <Form.Group controlId="password" className="mb-2">
                <Form.Label>Password</Form.Label>
                <div className="input-group">
                  <Form.Control
                    type={showPw ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={onPwKeyUp}
                    autoComplete="current-password"
                    required
                    aria-describedby="pw-toggle caps-hint"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPw((s) => !s)}
                    id="pw-toggle"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                {capsOn && (
                  <div id="caps-hint" className="text-warning small mt-1" role="status" aria-live="polite">
                    Caps Lock is ON
                  </div>
                )}
              </Form.Group>

              {/* Keep me signed in */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Form.Check
                  id="keep"
                  type="checkbox"
                  label="Keep me signed in"
                  checked={keep}
                  onChange={(e) => setKeep(!!e.target.checked)}
                />
                <Link to="/forgot-password" className="small">Forgot password?</Link>
              </div>

              <Button type="submit" variant="dark" className="w-100 rounded-1">
                Sign In
              </Button>
            </Form>
          </Card.Body>
        </Card>

        {/* Or divider */}
        {hasSocial && (
          <>
            <div className="text-center my-3 position-relative">
              <span className="bg-white px-3 text-muted">or</span>
              <hr className="m-0 position-absolute top-50 start-0 end-0" style={{ zIndex: -1 }} />
            </div>

            {/* Social buttons (guarded by hasSocial) */}
            <div className="d-grid gap-2 mb-3">
              <Button
                variant="outline-dark"
                className="rounded-1"
                onClick={() => signInWithProvider('google')}
                aria-label="Continue with Google"
              >
                <i className="fab fa-google me-2" aria-hidden="true" /> Continue with Google
              </Button>
              <Button
                variant="outline-dark"
                className="rounded-1"
                onClick={() => signInWithProvider('apple')}
                aria-label="Continue with Apple"
              >
                <i className="fab fa-apple me-2" aria-hidden="true" /> Continue with Apple
              </Button>
            </div>
          </>
        )}

        {/* Helper text */}
        <Row className="py-3 text-center">
          <Col>
            New customer?{' '}
            <Link to={redirect ? `/register?redirect=${redirect}` : '/register'}>
              Create an account
            </Link>
          </Col>
        </Row>

        {/* SR live region for async auth status */}
        <div className="visually-hidden" aria-live="polite">
          {loading ? 'Signing you in…' : (user ? 'Signed in' : '')}
        </div>
      </main>
    </FormContainer>
  );
}
