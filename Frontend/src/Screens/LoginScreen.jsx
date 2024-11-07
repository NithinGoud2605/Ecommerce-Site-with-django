import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Row, Col } from 'react-bootstrap';
import FormContainer from '../components/FormContainer';
import Loader from '../components/Loader';
import Message from '../components/Message';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      navigate(redirect);
    }
  }, [navigate, redirect]);

  const submitHandler = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const response = await fetch('/api/users/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: email, password }), // Changed `email` to `username`
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error details:', errorData);
      throw new Error(errorData.detail || 'Failed to login');
    }

    const data = await response.json();
    localStorage.setItem('userInfo', JSON.stringify(data));
    setLoading(false);
    navigate(redirect);
  } catch (err) {
    setError(err.message);
    setLoading(false);
  }
};


  return (
    <FormContainer>
      <h1>Sign In</h1>
      {error && <Message variant="danger">{error}</Message>}
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
