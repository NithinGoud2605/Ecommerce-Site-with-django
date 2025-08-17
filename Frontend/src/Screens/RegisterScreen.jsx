import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import FormContainer from '../Components/FormContainer'; // fix case
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { useAuth } from '../hooks/useAuth';
import { setMeta } from '../lib/seo.js';

function strengthLabel(pw) {
  if (!pw) return '';
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score >= 4) return 'Strong';
  if (score >= 3) return 'Good';
  if (score >= 2) return 'Weak';
  return 'Very weak';
}

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const { user, loading, error, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect') || '/';

  const pwStrength = useMemo(() => strengthLabel(password), [password]);

  useEffect(() => {
    setMeta({ title: 'Sign Up – Vyshnavi Pelimelli', description: 'Create your atelier account.' });
  }, []);

  useEffect(() => {
    if (user) navigate(redirect);
  }, [user, navigate, redirect]);

  const validate = () => {
    if (!name.trim()) return 'Please enter your name.';
    if (!/.+@.+\..+/.test(String(email))) return 'Enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLocalError('');
    setInfo('');

    const v = validate();
    if (v) { setLocalError(v); return; }

    try {
      setSubmitting(true);
      const { error: err } = await signUp(name.trim(), email.trim(), password);
      if (err) throw err;
      navigate(redirect);
    } catch (err) {
      setLocalError(err?.message || 'Failed to sign up.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormContainer>
      <h1>Create Account</h1>

      {localError && <Message variant="danger" aria-live="assertive">{localError}</Message>}
      {error && <Message variant="danger" aria-live="assertive">{error}</Message>}
      {info && <Alert variant="info" aria-live="polite">{info}</Alert>}
      {loading && <Loader />}

      <Form onSubmit={submitHandler} noValidate className="mt-3">
        <Form.Group controlId="name" className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </Form.Group>

        <Form.Group controlId="email" className="mb-3">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </Form.Group>

        <Form.Group controlId="password" className="mb-3">
          <Form.Label>Password</Form.Label>
          <InputGroup>
            <Form.Control
              type={showPw ? 'text' : 'password'}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              aria-describedby="pw-strength"
            />
            <Button variant="outline-secondary" onClick={() => setShowPw(s => !s)} tabIndex={-1}>
              {showPw ? 'Hide' : 'Show'}
            </Button>
          </InputGroup>
          {password && (
            <div id="pw-strength" className="small mt-1 text-muted">Strength: {pwStrength}</div>
          )}
        </Form.Group>

        <Form.Group controlId="confirmPassword" className="mb-3">
          <Form.Label>Confirm password</Form.Label>
          <InputGroup>
            <Form.Control
              type={showPw2 ? 'text' : 'password'}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <Button variant="outline-secondary" onClick={() => setShowPw2(s => !s)} tabIndex={-1}>
              {showPw2 ? 'Hide' : 'Show'}
            </Button>
          </InputGroup>
        </Form.Group>

        <Button type="submit" variant="primary" className="w-100" disabled={submitting || loading}>
          {submitting ? 'Creating account…' : 'Register'}
        </Button>
      </Form>

      <Row className="py-3">
        <Col className="text-center text-muted">
          Already have an account?{' '}
          <Link to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'}>
            Sign in
          </Link>
        </Col>
      </Row>
    </FormContainer>
  );
}