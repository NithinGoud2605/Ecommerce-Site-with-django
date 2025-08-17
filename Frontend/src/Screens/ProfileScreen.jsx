import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Row, Col, Table, Form, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { setMeta } from '../lib/seo.js';
import axios from '../axiosInstance';

function fmtMoneyCents(cents, currency = 'USD') {
  const v = Number(cents || 0) / 100;
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(v); }
  catch { return `$${v.toFixed(2)}`; }
}

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [origEmail, setOrigEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ui state
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  const emailChanged = useMemo(() => email.trim() && origEmail && email.trim() !== origEmail.trim(), [email, origEmail]);

  useEffect(() => {
    setMeta({ title: 'Profile – Vyshnavi Pelimelli', description: 'Manage your profile and orders.' });
  }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user || authLoading) return;

    async function loadProfile() {
      try {
        setProfileLoading(true); setProfileError('');
        const { data } = await axios.get('/api/users/profile/');
        const nm = data?.name || '';
        const em = data?.email || '';
        setName(nm); setEmail(em); setOrigEmail(em);
      } catch (err) {
        setProfileError(err?.response?.data?.detail || err?.message || 'Failed to load profile.');
      } finally { setProfileLoading(false); }
    }

    async function loadOrders() {
      try {
        setOrdersLoading(true); setOrdersError('');
        const { data } = await axios.get('/api/orders/myorders/');
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setOrdersError(err?.response?.data?.detail || err?.message || 'Failed to load orders.');
      } finally { setOrdersLoading(false); }
    }

    loadProfile();
    loadOrders();
  }, [user, authLoading]);

  async function onSave(e) {
    e.preventDefault();
    setProfileError(''); setProfileSuccess(false);

    if (password || confirmPassword) {
      if (password !== confirmPassword) { setProfileError('Passwords do not match.'); return; }
      if (password.length < 6) { setProfileError('Password must be at least 6 characters.'); return; }
    }

    try {
      setProfileLoading(true);
      const payload = { name: name.trim(), email: email.trim() };
      if (password) payload.password = password;
      const { data } = await axios.put('/api/users/profile/update/', payload);
      setName(data?.name || name);
      setEmail(data?.email || email);
      setOrigEmail(data?.email || email);
      setPassword(''); setConfirmPassword('');
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(err?.response?.data?.detail || err?.message || 'Failed to update profile.');
    } finally { setProfileLoading(false); }
  }

  const exportOrders = () => {
    if (!orders?.length) return;
    const cols = ['_id','createdAt','totalPrice','isPaid','paidAt','isDelivered','deliveredAt'];
    const head = cols.join(',');
    const rows = orders.map(o => cols.map(k => {
      const v = o[k] == null ? '' : String(o[k]);
      return /[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(','));
    const blob = new Blob([head + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Row>
      <Col md={3}>
        <h2>Account</h2>

        {profileError && <Message variant="danger" aria-live="assertive">{profileError}</Message>}
        {profileSuccess && <Message variant="success" aria-live="polite">Profile updated</Message>}
        {(profileLoading || authLoading) && <Loader />}

        <Form onSubmit={onSave} noValidate>
          <Form.Group controlId="name" className="mb-3">
            <Form.Label>Full name</Form.Label>
            <Form.Control required type="text" placeholder="Your name" value={name} onChange={(e)=>setName(e.target.value)} autoComplete="name" />
          </Form.Group>

          <Form.Group controlId="email" className="mb-3">
            <Form.Label>Email address</Form.Label>
            <Form.Control required type="email" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" />
          </Form.Group>

          <Form.Group controlId="password" className="mb-3">
            <Form.Label>New password (optional)</Form.Label>
            <Form.Control type="password" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password" />
          </Form.Group>

          <Form.Group controlId="passwordConfirm" className="mb-3">
            <Form.Label>Confirm new password</Form.Label>
            <Form.Control type="password" placeholder="Repeat new password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} autoComplete="new-password" />
          </Form.Group>

          <Button type="submit" variant="primary" disabled={profileLoading || authLoading} className="w-100">
            {profileLoading ? 'Saving…' : 'Save changes'}
          </Button>
        </Form>
      </Col>

      <Col md={9}>
        <div className="d-flex align-items-center justify-content-between">
          <h2>My Orders</h2>
          <Button variant="outline-secondary" size="sm" onClick={exportOrders} disabled={!orders?.length}>Export CSV</Button>
        </div>

        {ordersLoading ? (
          <Loader />
        ) : ordersError ? (
          <Message variant="danger">{ordersError}</Message>
        ) : !orders?.length ? (
          <Message variant="info">No orders yet. <Link to="/shop">Start shopping</Link>.</Message>
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
              {orders.map((o) => (
                <tr key={o._id || o.id}>
                  <td className="text-monospace">{o._id || o.id}</td>
                  <td>{String(o.createdAt || o.created_at).substring(0,10)}</td>
                  <td>{fmtMoneyCents((o.totalPrice ?? o.subtotal_cents*1) * 100 ? o.totalPrice*100 : o.subtotal_cents, o.currency || 'USD')}</td>
                  <td>{o.isPaid || o.is_paid ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>}</td>
                  <td>{o.isDelivered || o.is_delivered ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>}</td>
                  <td><Link to={`/order/${o._id || o.id}`} className="btn btn-sm btn-light">Details</Link></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Col>
    </Row>
  );
}
