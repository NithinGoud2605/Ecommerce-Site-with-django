import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Form, Button, Alert, Table, Badge } from 'react-bootstrap';
import axios from '../axiosInstance';

export default function UserAdminDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [isAdmin, setIsAdmin] = React.useState(false);

  const userInfo = React.useMemo(() => { try { return JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch { return null; } }, []);
  const auth = React.useMemo(() => userInfo?.token ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {}, [userInfo]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true); setError('');
        const [u, all] = await Promise.all([
          axios.get(`/api/users/${id}/`, auth),
          axios.get('/api/orders/', auth),
        ]);
        if (!mounted) return;
        setUser(u.data);
        setName(u.data?.name || '');
        setEmail(u.data?.email || '');
        setIsAdmin(!!u.data?.isAdmin);
        // filter orders for this user
        const list = Array.isArray(all.data) ? all.data : (all.data?.orders || []);
        setOrders(list.filter(o => String(o?.user?.id || o?.user?._id) === String(id)));
      } catch (e) {
        if (!mounted) return; setError(e?.response?.data?.detail || e?.message || 'Failed to load user');
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [id]);

  async function save(e) {
    e.preventDefault();
    try {
      await axios.put(`/api/users/update/${id}/`, { name, email, isAdmin }, auth);
      navigate('/admin/userlist');
    } catch (e) { setError(e?.response?.data?.detail || 'Failed to save'); }
  }

  if (loading) return <div className="p-3">Loading…</div>;
  if (error) return <Alert variant="danger" className="m-3">{error}</Alert>;
  if (!user) return <Alert variant="warning" className="m-3">User not found</Alert>;

  return (
    <div>
      <h1 style={{ fontFamily:'Playfair Display, serif' }}>User</h1>
      <Row className="g-3">
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Header>Profile</Card.Header>
            <Card.Body>
              <Form onSubmit={save}>
                <Form.Group className="mb-2">
                  <Form.Label>Name</Form.Label>
                  <Form.Control value={name} onChange={(e)=>setName(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
                </Form.Group>
                <Form.Check className="mb-3" type="switch" label="Admin" checked={isAdmin} onChange={(e)=>setIsAdmin(!!e.target.checked)} />
                <div className="d-flex justify-content-between">
                  <Button variant="outline-dark" onClick={()=>navigate(-1)}>Back</Button>
                  <Button type="submit" variant="dark">Save</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header>Orders</Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead><tr><th>ID</th><th>Date</th><th>Total</th><th>Paid</th><th>Delivered</th><th /></tr></thead>
                <tbody>
                  {(orders || []).map(o => (
                    <tr key={o._id || o.id}>
                      <td className="text-monospace">{o._id || o.id}</td>
                      <td>{new Date(o.createdAt || o.created_at).toLocaleDateString?.() || '-'}</td>
                      <td>${(o.totalPrice ?? o.total_price ?? 0).toFixed(2)}</td>
                      <td>{(o.isPaid || o.paidAt) ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>}</td>
                      <td>{(o.isDelivered || o.deliveredAt) ? <Badge bg="dark">Yes</Badge> : <Badge bg="warning" text="dark">No</Badge>}</td>
                      <td className="text-end"><Button variant="light" size="sm" onClick={()=>navigate(`/admin/orders/${o._id || o.id}`)}>View</Button></td>
                    </tr>
                  ))}
                  {(orders || []).length === 0 && (
                    <tr><td colSpan={6} className="text-center text-muted py-3">No orders</td></tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}


