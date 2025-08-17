import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Table, Badge, Button, Form, Alert } from 'react-bootstrap';
import axios from '../axiosInstance';

export default function OrderAdminDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [amount, setAmount] = React.useState('');

  const userInfo = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch { return null; }
  }, []);

  const auth = React.useMemo(() => userInfo?.token ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {}, [userInfo]);

  async function load() {
    try {
      setLoading(true); setError('');
      const { data } = await axios.get(`/api/orders/${id}/`, auth);
      setOrder(data);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to load order');
    } finally { setLoading(false); }
  }

  React.useEffect(() => { load(); }, [id]);

  async function markDelivered() {
    try { await axios.put(`/api/orders/${id}/deliver/`, {}, auth); await load(); } catch {}
  }
  async function markPaid() {
    try { await axios.put(`/api/orders/${id}/pay/`, {}, auth); await load(); } catch {}
  }
  async function issueRefund(e) {
    e.preventDefault();
    const value = parseFloat(amount || '0');
    if (!Number.isFinite(value) || value <= 0) return;
    try { await axios.put(`/api/orders/${id}/refund/`, { amount: value }, auth); setAmount(''); await load(); } catch {}
  }

  if (loading) return <div className="p-3">Loading…</div>;
  if (error) return <Alert variant="danger" className="m-3">{error}</Alert>;
  if (!order) return <Alert variant="warning" className="m-3">Order not found</Alert>;

  const items = Array.isArray(order.orderItems) ? order.orderItems : [];
  const addr = order.shippingAddress || {};

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0" style={{ fontFamily:'Playfair Display, serif' }}>Order #{order._id || order.id}</h1>
        <div className="d-flex gap-2">
          <Button variant="outline-dark" onClick={()=>navigate(-1)}>Back</Button>
          <Button variant="dark" onClick={markPaid} disabled={order.isPaid}>Mark Paid</Button>
          <Button variant="dark" onClick={markDelivered} disabled={order.isDelivered}>Mark Delivered</Button>
        </div>
      </div>

      <Row className="g-3">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header>Items</Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td>{it.name}</td>
                      <td>{it.qty}</td>
                      <td>${Number(it.price || 0).toFixed(2)}</td>
                      <td>${(Number(it.price || 0) * Number(it.qty || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm mb-3">
            <Card.Header>Status</Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between"><span>Paid</span><strong>{order.isPaid ? 'Yes' : 'No'}</strong></div>
              <div className="d-flex justify-content-between"><span>Delivered</span><strong>{order.isDelivered ? 'Yes' : 'No'}</strong></div>
              <div className="d-flex justify-content-between"><span>Refunded</span><strong>${Number(order.refundTotal || 0).toFixed(2)}</strong></div>
            </Card.Body>
          </Card>
          <Card className="shadow-sm mb-3">
            <Card.Header>Shipping</Card.Header>
            <Card.Body>
              <div>{addr.address}</div>
              <div>{addr.city} {addr.postalCode}</div>
              <div>{addr.country}</div>
            </Card.Body>
          </Card>
          <Card className="shadow-sm">
            <Card.Header>Refund</Card.Header>
            <Card.Body>
              <Form onSubmit={issueRefund} className="d-flex gap-2">
                <Form.Control type="number" step="0.01" placeholder="Amount" value={amount} onChange={(e)=>setAmount(e.target.value)} />
                <Button type="submit" variant="outline-dark">Issue</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}


