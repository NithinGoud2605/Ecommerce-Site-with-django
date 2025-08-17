import React from 'react';
import { Card, Row, Col, Table, Badge, Button, ButtonGroup, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from '../axiosInstance';

function useDashboardData() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [data, setData] = React.useState({ users: [], orders: [], products: [], analytics: null });
  const userInfoRef = React.useRef(null);

  React.useEffect(() => {
    try { userInfoRef.current = JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch { userInfoRef.current = null; }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true); setError('');
        const auth = userInfoRef.current?.token ? { headers: { Authorization: `Bearer ${userInfoRef.current.token}` } } : {};
        // Load users and orders in parallel
        const [u, o, a] = await Promise.all([
          axios.get('/api/users/', auth),
          axios.get('/api/orders/', auth),
          axios.get('/api/orders/analytics/?days=365', auth),
        ]);
        // Load up to 5 pages of products for low-stock view
        const first = await axios.get('/api/products/?page=1&sort_by=name&order=asc');
        const totalPages = Math.min(Number(first.data?.pages || 1), 5);
        const pageCalls = [];
        for (let p = 2; p <= totalPages; p++) pageCalls.push(axios.get(`/api/products/?page=${p}&sort_by=name&order=asc`));
        const rest = pageCalls.length ? await Promise.all(pageCalls) : [];
        const products = [ ...(first.data?.products || []), ...rest.flatMap(r => r.data?.products || []) ];
        if (!mounted) return;
        setData({
          users: Array.isArray(u.data) ? u.data : [],
          orders: Array.isArray(o.data) ? o.data : (o.data?.orders || []),
          products,
          analytics: a?.data || null,
        });
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.detail || e?.message || 'Failed to load dashboard');
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  return { loading, error, data };
}

export default function DashboardAdmin() {
  const { loading, error, data } = useDashboardData();

  // Date range filter
  const [range, setRange] = React.useState('30'); // 7 | 30 | 90 | 365 | all
  const now = React.useMemo(() => new Date(), []);
  const fromDate = React.useMemo(() => {
    if (range === 'all') return new Date(0);
    const d = new Date();
    d.setDate(d.getDate() - Number(range));
    return d;
  }, [range]);

  const ordersInRange = React.useMemo(() => {
    const list = Array.isArray(data.orders) ? data.orders : [];
    return list.filter(o => {
      const ts = new Date(o.createdAt || o.created_at || 0).getTime();
      return Number.isFinite(ts) && ts >= fromDate.getTime();
    });
  }, [data.orders, fromDate]);

  const totalSales = React.useMemo(() => ordersInRange.reduce((sum, o) => sum + (o.totalPrice ?? o.total_price ?? 0), 0), [ordersInRange]);
  const avgOrderValue = React.useMemo(() => ordersInRange.length ? totalSales / ordersInRange.length : 0, [ordersInRange, totalSales]);
  const pendingCount = React.useMemo(() => ordersInRange.filter(o => !(o.isDelivered || o.deliveredAt)).length, [ordersInRange]);
  const paidCount = React.useMemo(() => ordersInRange.filter(o => (o.isPaid || o.paidAt)).length, [ordersInRange]);
  const deliveredRate = React.useMemo(() => {
    const n = ordersInRange.length || 1;
    const delivered = ordersInRange.filter(o => (o.isDelivered || o.deliveredAt)).length;
    return Math.round((delivered / n) * 100);
  }, [ordersInRange]);
  const paidRate = React.useMemo(() => {
    const n = ordersInRange.length || 1;
    return Math.round((paidCount / n) * 100);
  }, [ordersInRange, paidCount]);

  // Build daily revenue series for line chart
  const revenueSeries = React.useMemo(() => {
    // bucket by day for the chosen range
    const days = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const start = new Date(fromDate);
    start.setHours(0,0,0,0);
    const end = new Date(now);
    end.setHours(0,0,0,0);
    for (let t = start.getTime(); t <= end.getTime(); t += dayMs) {
      days.push({ t, total: 0 });
    }
    const byDay = new Map(days.map(d => [d.t, d]));
    for (const o of ordersInRange) {
      const t = new Date(o.createdAt || o.created_at || 0);
      t.setHours(0,0,0,0);
      const key = t.getTime();
      const bucket = byDay.get(key);
      if (bucket) bucket.total += (o.totalPrice ?? o.total_price ?? 0);
    }
    return days.map(d => ({ x: d.t, y: d.total }));
  }, [ordersInRange, fromDate, now]);

  // Compute top products by revenue using order items
  const topProducts = React.useMemo(() => {
    const map = new Map();
    for (const o of ordersInRange) {
      const items = Array.isArray(o.orderItems) ? o.orderItems : (o.orderitems || []);
      for (const it of items) {
        const key = String(it.product || it.name || it.id);
        const prev = map.get(key) || { name: it.name || `#${it.product || 'item'}`, qty: 0, revenue: 0 };
        prev.qty += Number(it.qty || 0);
        prev.revenue += Number(it.price || 0) * Number(it.qty || 0);
        map.set(key, prev);
      }
    }
    return Array.from(map.values()).sort((a,b) => b.revenue - a.revenue).slice(0,5);
  }, [ordersInRange]);

  // Low stock products
  const lowStock = React.useMemo(() => {
    const list = Array.isArray(data.products) ? data.products : [];
    return list.filter(p => (p.countInStock ?? 0) > 0 && (p.countInStock ?? 0) < 5)
               .sort((a,b) => (a.countInStock ?? 0) - (b.countInStock ?? 0))
               .slice(0, 8);
  }, [data.products]);

  // SVG line chart generator
  function RevenueChart({ series, height = 100 }) {
    const width = 520;
    const padding = 24;
    const xs = series.map(p => p.x);
    const ys = series.map(p => p.y);
    const minX = xs[0] ?? 0, maxX = xs[xs.length - 1] ?? 1;
    const maxY = Math.max(1, ...ys);
    const scaleX = (x) => padding + ((x - minX) / Math.max(1, (maxX - minX))) * (width - padding * 2);
    const scaleY = (y) => height - padding - (y / maxY) * (height - padding * 2);
    const d = series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`).join(' ');
    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <path d={d || ''} fill="none" stroke="#222" strokeWidth="2" />
        {/* baseline */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ddd" />
      </svg>
    );
  }

  // Simple donut chart for paid vs unpaid
  function Donut({ paid, total, size = 160 }) {
    const radius = (size / 2) - 10;
    const circumference = 2 * Math.PI * radius;
    const paidLen = circumference * (total ? (paid / total) : 0);
    const unpaidLen = Math.max(0, circumference - paidLen);
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size/2},${size/2})`}>
          <circle r={radius} fill="none" stroke="#e9ecef" strokeWidth={14} />
          <circle
            r={radius}
            fill="none"
            stroke="#212529"
            strokeWidth={14}
            strokeDasharray={`${paidLen} ${unpaidLen}`}
            transform="rotate(-90)"
          />
          <text y="6" textAnchor="middle" fontSize="20" fontWeight="600">{total ? Math.round((paid/total)*100) : 0}%</text>
          <text y="28" textAnchor="middle" fill="#6c757d" fontSize="11">Paid</text>
        </g>
      </svg>
    );
  }

  const activeProducts = React.useMemo(() => (Array.isArray(data.products) ? data.products.filter(p => (p.countInStock ?? 0) > 0).length : 0), [data.products]);

  function exportOrdersCsv() {
    const rows = [
      ['ID','Date','Total','Paid','Delivered'],
      ...ordersInRange.map(o => [
        o._id || o.id,
        new Date(o.createdAt || o.created_at || 0).toISOString(),
        (o.totalPrice ?? o.total_price ?? 0),
        (o.isPaid || o.paidAt) ? 'Yes' : 'No',
        (o.isDelivered || o.deliveredAt) ? 'Yes' : 'No',
      ])
    ];
    const blob = new Blob(rows.map(r => r.join(',')).join('\n'), { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `orders_${range}d.csv`; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Range and quick actions */}
      <Row className="g-2 align-items-center mb-3">
        <Col md="auto">
          <div className="text-muted small">Date range</div>
          <ButtonGroup>
            {['7','30','90','365','all'].map(r => (
              <Button key={r} size="sm" variant={range===r?'dark':'outline-dark'} onClick={()=>setRange(r)}>
                {r==='all'?'All':`${r}d`}
              </Button>
            ))}
          </ButtonGroup>
        </Col>
        <Col className="text-end">
          <Button as={Link} to="/admin/products" variant="outline-dark" className="me-2">Manage Products</Button>
          <Button as={Link} to="/admin/orders" variant="outline-dark" className="me-2">View Orders</Button>
          <Button as={Link} to="/admin/userlist" variant="outline-dark">Manage Users</Button>
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col md={3} sm={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="text-muted">Users</div>
              <div className="display-6">{(data.users || []).length}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="text-muted">Orders</div>
              <div className="display-6">{ordersInRange.length}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="text-muted">Avg Order</div>
              <div className="display-6">${avgOrderValue.toFixed(2)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="text-muted">Sales (recent)</div>
              <div className="display-6">${totalSales.toFixed(2)}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Revenue chart and status */}
      <Row className="g-3 mb-3">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header>Revenue</Card.Header>
            <Card.Body>
              <RevenueChart series={revenueSeries} />
              <div className="text-end"><Button size="sm" variant="outline-dark" onClick={exportOrdersCsv}>Export CSV</Button></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Header>Status</Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between"><span>Pending</span><strong>{pendingCount}</strong></div>
              <div className="d-flex justify-content-between"><span>Delivered rate</span><strong>{deliveredRate}%</strong></div>
              <div className="d-flex justify-content-between"><span>Low stock SKUs</span><strong>{lowStock.length}</strong></div>
              <div className="d-flex justify-content-between"><span>Active products</span><strong>{activeProducts}</strong></div>
            </Card.Body>
          </Card>
          <Card className="shadow-sm mt-3">
            <Card.Header>Paid vs Unpaid</Card.Header>
            <Card.Body className="d-flex justify-content-center">
              <Donut paid={paidCount} total={ordersInRange.length} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header>Recent Orders</Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead><tr><th>ID</th><th>Date</th><th>Total</th><th>Paid</th><th>Delivered</th><th /></tr></thead>
                <tbody>
                  {ordersInRange.slice(0, 8).map(o => (
                    <tr key={o._id || o.id}>
                      <td className="text-monospace">{o._id || o.id}</td>
                      <td>{new Date(o.createdAt || o.created_at).toLocaleDateString?.() || '-'}</td>
                      <td>${(o.totalPrice ?? o.total_price ?? 0).toFixed(2)}</td>
                      <td>{(o.isPaid || o.paidAt) ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>}</td>
                      <td>{(o.isDelivered || o.deliveredAt) ? <Badge bg="dark">Yes</Badge> : <Badge bg="warning" text="dark">No</Badge>}</td>
                      <td className="text-end"><Button as={Link} to={`/order/${o._id || o.id}`} size="sm" variant="light">View</Button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header>Recent Users</Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead><tr><th>Name</th><th>Email</th><th /></tr></thead>
                <tbody>
                  {(data.users || []).slice(0, 8).map(u => (
                    <tr key={u._id || u.id}>
                      <td>{u.name || u.username || '-'}</td>
                      <td><a className="text-decoration-none" href={`mailto:${u.email}`}>{u.email}</a></td>
                      <td className="text-end"><Button as={Link} to={`/admin/user/${u._id || u.id}`} size="sm" variant="light">Edit</Button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mt-1">
        <Col>
          <Card className="shadow-sm">
            <Card.Header>Top Products</Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead><tr><th>Name</th><th>Qty</th><th>Revenue</th></tr></thead>
                <tbody>
                  {topProducts.map(p => (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td>{p.qty}</td>
                      <td>${p.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mt-1">
        <Col>
          <Card className="shadow-sm">
            <Card.Header>Low Stock</Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead><tr><th>Name</th><th>Stock</th><th /></tr></thead>
                <tbody>
                  {lowStock.map(p => (
                    <tr key={p._id || p.id}>
                      <td>{p.name}</td>
                      <td><Badge bg={p.countInStock < 3 ? 'danger' : 'warning'} text={p.countInStock < 3 ? undefined : 'dark'}>{p.countInStock}</Badge></td>
                      <td className="text-end"><Button as={Link} to={`/admin/products`} size="sm" variant="light">Restock</Button></td>
                    </tr>
                  ))}
                  {lowStock.length === 0 && (
                    <tr><td colSpan={3} className="text-center text-muted py-3">No low stock items</td></tr>
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


