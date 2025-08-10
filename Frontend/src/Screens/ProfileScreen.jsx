import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, Table } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { setMeta } from '../lib/seo.js';

function ProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorOrders, setErrorOrders] = useState(null);

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .maybeSingle();
        if (error) throw error;
        setName(data?.full_name || '');
        setEmail(data?.email || user.email || '');
        setLoading(false);
      } catch (error) {
        setError(
          error?.message || 'Failed to load profile'
        );
        setLoading(false);
      }
    };

    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        const { data, error } = await supabase
          .from('orders')
          .select('id, created_at, subtotal_cents, is_paid, paid_at')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setOrders(data || []);
        setLoadingOrders(false);
      } catch (error) {
        setErrorOrders(
          error?.message || 'Failed to load orders'
        );
        setLoadingOrders(false);
      }
    };

    if (user && !authLoading) {
      fetchUserDetails();
      fetchOrders();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    setMeta({ title: 'Profile – Handmade Hub', description: 'Manage your profile and orders.' });
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
    } else {
      setMessage('');
      try {
        setLoading(true);
        const { error } = await supabase
          .from('profiles')
          .upsert({ id: user.id, full_name: name, email })
          .eq('id', user.id);
        if (error) throw error;
        setSuccess(true);
        setLoading(false);
      } catch (error) {
        setError(
          error?.message || 'Failed to update profile'
        );
        setLoading(false);
      }
    }
  };

  return (
    <Row>
      <Col md={3}>
        <h2>User Profile</h2>
        {message && <Message variant="danger">{message}</Message>}
        {error && <Message variant="danger">{error}</Message>}
        {success && <Message variant="success">Profile Updated</Message>}
        {loading && <Loader />}
        <Form onSubmit={submitHandler}>
          <Form.Group controlId="name">
            <Form.Label>Name</Form.Label>
            <Form.Control
              required
              type="name"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="email">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              required
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="passwordConfirm">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Form.Group>

          <Button type="submit" variant="primary">
            Update
          </Button>
        </Form>
      </Col>

      <Col md={9}>
        <h2>My Orders</h2>
        {loadingOrders ? (
          <Loader />
        ) : errorOrders ? (
          <Message variant="danger">{errorOrders}</Message>
        ) : (
          <Table striped responsive className="table-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Delivered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order.id}</td>
                  <td>{String(order.created_at).substring(0, 10)}</td>
                  <td>${(order.subtotal_cents / 100).toFixed(2)}</td>
                  <td>
                    {order.is_paid ? (
                      String(order.paid_at).substring(0, 10)
                    ) : (
                      <i className="fas fa-times" style={{ color: 'red' }}></i>
                    )}
                  </td>
                  <td>
                    <Link to={`/order/${order.id}`} className="btn btn-sm btn-light">
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Col>
    </Row>
  );
}

export default ProfileScreen;
