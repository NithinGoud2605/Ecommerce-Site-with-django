import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import FormContainer from '../components/FormContainer';
import Loader from '../Components/Loader';
import { useAuth } from '../hooks/useAuth';
import { setMeta } from '../lib/seo.js';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, loading, error, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (user) navigate(redirect);
  }, [user, navigate, redirect]);

  useEffect(() => {
    setMeta({ title: 'Sign In – Handmade Hub', description: 'Access your Handmade Hub account.' });
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    await signIn(email, password);
  };

  return (
    <FormContainer>
      <h1>Sign In</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading && <Loader />}
      <Form onSubmit={submitHandler} className="mt-3">
        <Form.Group controlId="email" className="mb-3">
          <Form.Label>Email Address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="password" className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>

        <Button type="submit" variant="primary" className="w-100">
          Sign In
        </Button>
      </Form>

      <Row className="py-3 text-center">
        <Col>
          New Customer?{' '}
          <Link to={redirect ? `/register?redirect=${redirect}` : '/register'}>
            Register
          </Link>
        </Col>
      </Row>
    </FormContainer>
  );
}

export default LoginScreen;
