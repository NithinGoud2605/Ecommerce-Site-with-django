import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Table, Button, Form, Row, Col, Pagination, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import Loader from '../Components/Loader'; // fixed casing
import Message from '../Components/Message'; // fixed casing
import { setMeta } from '../lib/seo.js';

const fmtDate = (v) => {
  if (!v) return '—';
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toISOString().slice(0,10);
  } catch { return '—'; }
};
const fmtMoney = (n) => {
  if (n == null || Number.isNaN(Number(n))) return '$0.00';
  try {
    return new Intl.NumberFormat(undefined, { style:'currency', currency:'USD' }).format(Number(n));
  } catch { return `$${Number(n).toFixed(2)}`; }
};

export default function OrderListScreen() {
  const navigate = useNavigate();
  const userInfo = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch { return null; }
  }, []);

  // meta
  useEffect(() => {
    setMeta({ title: 'Orders – Admin – Vyshnavi Pelimelli', description: 'Admin: manage orders.' });
  }, []);

  // guard
  useEffect(() => {
    if (!userInfo || !(userInfo.isAdmin || userInfo.is_staff)) {
      navigate('/login');
    }
  }, [navigate, userInfo]);

  // data
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const controllerRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    if (!userInfo) return;
    controllerRef.current?.abort?.();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;

    setLoading(true);
    setFetchError('');
    try {
      const { data } = await axiosInstance.get('/api/orders/', {
        headers: { Authorization: `Bearer ${userInfo.token}` },
        signal: ctrl.signal,
      });
      // normalize
      const rows = Array.isArray(data) ? data : (data?.orders || []);
      setOrders(rows.map(o => ({
        id: o._id || o.id,
        userName: o.user?.name || o.user?.email || '—',
        createdAt: o.createdAt || o.created_at,
        totalPrice: o.totalPrice ?? o.total_price ?? 0,
        isPaid: !!o.isPaid || !!o.paidAt,
        paidAt: o.paidAt,
        isDelivered: !!o.isDelivered || !!o.deliveredAt,
        deliveredAt: o.deliveredAt,
      })));
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      setFetchError(err?.response?.data?.detail || err?.message || 'Error loading orders');
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // auto-refresh (30s)
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchOrders, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchOrders]);

  // filters / sort / paging
  const [query, setQuery] = useState('');
  const [paid, setPaid] = useState('all'); // all | paid | unpaid
  const [delivered, setDelivered] = useState('all'); // all | delivered | undelivered
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ field: 'createdAt', dir: 'desc' }); // field in: id,userName,createdAt,totalPrice,isPaid,isDelivered

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    return orders.filter(o => {
      if (q) {
        const hit = String(o.id).toLowerCase().includes(q) ||
                    String(o.userName).toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (paid !== 'all') {
        if (paid === 'paid' && !o.isPaid) return false;
        if (paid === 'unpaid' && o.isPaid) return false;
      }
      if (delivered !== 'all') {
        if (delivered === 'delivered' && !o.isDelivered) return false;
        if (delivered === 'undelivered' && o.isDelivered) return false;
      }
      if (from || to) {
        const d = new Date(o.createdAt || 0);
        if (from && d < from) return false;
        if (to) {
          const end = new Date(to);
          end.setHours(23,59,59,999);
          if (d > end) return false;
        }
      }
      return true;
    });
  }, [orders, query, paid, delivered, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    const copy = filtered.slice();
    const { field, dir } = sort;
    copy.sort((a, b) => {
      const va = a[field];
      const vb = b[field];
      // boolean -> number; date -> Date; number -> number; string -> string
      const norm = (v) => {
        if (typeof v === 'boolean') return v ? 1 : 0;
        if (field.toLowerCase().includes('date') || field === 'createdAt' || field === 'paidAt' || field === 'deliveredAt') {
          const d = new Date(v || 0).getTime();
          return Number.isFinite(d) ? d : 0;
        }
        if (typeof v === 'number') return v;
        return String(v || '').toLowerCase();
      };
      const na = norm(va), nb = norm(vb);
      if (na < nb) return dir === 'asc' ? -1 : 1;
      if (na > nb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const visible = sorted.slice(start, start + perPage);

  useEffect(() => { setPage(1); }, [query, paid, delivered, dateFrom, dateTo, perPage]);

  const toggleSort = (field) => {
    setSort((s) => {
      if (s.field !== field) return { field, dir: 'asc' };
      return { field, dir: s.dir === 'asc' ? 'desc' : 'asc' };
    });
  };

  // bulk actions
  const [selected, setSelected] = useState({});
  const allVisibleChecked = useMemo(() => visible.length > 0 && visible.every(v => selected[v.id]), [visible, selected]);

  const toggleAllVisible = () => {
    setSelected((sel) => {
      const next = { ...sel };
      if (allVisibleChecked) {
        visible.forEach(v => { delete next[v.id]; });
      } else {
        visible.forEach(v => { next[v.id] = true; });
      }
      return next;
    });
  };

  const markDelivered = async () => {
    const ids = Object.keys(selected).filter(id => selected[id]);
    if (!ids.length) return;
    const conf = window.confirm(`Mark ${ids.length} order(s) as delivered?`);
    if (!conf) return;

    // optimistic update
    const prev = orders.slice();
    setOrders((os) => os.map(o => ids.includes(String(o.id)) ? { ...o, isDelivered: true, deliveredAt: new Date().toISOString() } : o));
    setSelected({});

    try {
      // throttle 3 at a time
      const chunk = 3;
      for (let i = 0; i < ids.length; i += chunk) {
        await Promise.all(ids.slice(i, i + chunk).map(id =>
          axiosInstance.put(`/api/orders/${id}/deliver/`, {}, {
            headers: { Authorization: `Bearer ${userInfo.token}` }
          })
        ));
      }
    } catch (e) {
      // revert on failure
      setOrders(prev);
      alert('Failed to mark delivered. Please try again.');
    }
  };

  const exportCsv = () => {
    const rows = [
      ['ID','User','Date','Total','Paid','PaidAt','Delivered','DeliveredAt'],
      ...sorted.map(o => [
        o.id, o.userName, fmtDate(o.createdAt), o.totalPrice, o.isPaid ? 'Yes' : 'No',
        fmtDate(o.paidAt), o.isDelivered ? 'Yes' : 'No', fmtDate(o.deliveredAt)
      ])
    ];
    const blob = new Blob(rows.map(r => r.map(cell => {
      const s = String(cell ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(',')).join('\n'), { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <header className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
        <div>
          <h1 className="mb-1" style={{ fontFamily:'Playfair Display, serif' }}>Orders</h1>
          <div className="text-muted small" aria-live="polite">
            {loading ? 'Loading…' : `${sorted.length} result${sorted.length === 1 ? '' : 's'}`}
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-dark" onClick={fetchOrders}>Refresh</Button>
          <Button variant="outline-dark" onClick={exportCsv}>Export CSV</Button>
          <Form.Check
            type="switch"
            id="auto-refresh"
            label="Auto-refresh"
            checked={autoRefresh}
            onChange={(e)=>setAutoRefresh(!!e.target.checked)}
          />
          <Button variant="dark" disabled={!Object.values(selected).some(Boolean)} onClick={markDelivered}>
            Mark Delivered
          </Button>
        </div>
      </header>

      {/* Controls */}
      <Row className="g-2 align-items-end mb-3">
        <Col md={4}>
          <Form.Label htmlFor="order-search">Search</Form.Label>
          <Form.Control
            id="order-search"
            placeholder="Search by ID or customer"
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
          />
        </Col>
        <Col md={2}>
          <Form.Label>Paid</Form.Label>
          <Form.Select value={paid} onChange={(e)=>setPaid(e.target.value)}>
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Label>Delivered</Form.Label>
          <Form.Select value={delivered} onChange={(e)=>setDelivered(e.target.value)}>
            <option value="all">All</option>
            <option value="delivered">Delivered</option>
            <option value="undelivered">Undelivered</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Label>From</Form.Label>
          <Form.Control type="date" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} />
        </Col>
        <Col md={2}>
          <Form.Label>To</Form.Label>
          <Form.Control type="date" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} />
        </Col>
      </Row>

      <Row className="g-2 align-items-center mb-2">
        <Col md="auto">
          <Form.Label>Per page</Form.Label>
          <Form.Select value={perPage} onChange={(e)=>setPerPage(Number(e.target.value))}>
            {[10,20,30,50].map(n => <option key={n} value={n}>{n}</option>)}
          </Form.Select>
        </Col>
      </Row>

      {/* Table */}
      {loading ? (
        <Loader />
      ) : fetchError ? (
        <Message variant="danger">{fetchError}</Message>
      ) : (
        <div className="table-responsive">
          <Table striped hover className="table-sm align-middle admin-table">
            <caption className="visually-hidden">Orders list with sorting and filters</caption>
            <thead className="sticky-top bg-white border-bottom">
              <tr>
                <th style={{width:36}}>
                  <Form.Check
                    aria-label="Select visible"
                    checked={allVisibleChecked}
                    onChange={toggleAllVisible}
                  />
                </th>
                {[
                  { key:'id', label:'ID' },
                  { key:'userName', label:'User' },
                  { key:'createdAt', label:'Date' },
                  { key:'totalPrice', label:'Total' },
                  { key:'isPaid', label:'Paid' },
                  { key:'isDelivered', label:'Delivered' },
                  { key:'actions', label:'Actions', nosort:true },
                ].map(col => (
                  <Th
                    key={col.key}
                    activeKey={sort.field}
                    dir={sort.dir}
                    onClick={!col.nosort ? () => toggleSort(col.key) : undefined}
                    nosort={col.nosort}
                  >
                    {col.label}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(order => (
                <tr key={order.id}>
                  <td>
                    <Form.Check
                      aria-label={`Select order ${order.id}`}
                      checked={!!selected[order.id]}
                      onChange={(e)=>setSelected(s => ({ ...s, [order.id]: !!e.target.checked }))}
                    />
                  </td>
                  <td className="text-truncate" style={{maxWidth:160}}>
                    <Button variant="link" className="p-0" onClick={()=>navigate(`/order/${order.id}`)}>
                      {order.id}
                    </Button>
                  </td>
                  <td className="text-truncate" style={{maxWidth:180}}>{order.userName}</td>
                  <td>{fmtDate(order.createdAt)}</td>
                  <td>{fmtMoney(order.totalPrice)}</td>
                  <td>
                    {order.isPaid ? (
                      <Badge bg="success">Paid</Badge>
                    ) : (
                      <Badge bg="secondary" text="light">Unpaid</Badge>
                    )}
                  </td>
                  <td>
                    {order.isDelivered ? (
                      <Badge bg="dark">Delivered</Badge>
                    ) : (
                      <Badge bg="warning" text="dark">Pending</Badge>
                    )}
                  </td>
                  <td>
                    <Button
                      variant="light"
                      className="btn-sm"
                      onClick={() => navigate(`/order/${order.id}`)}
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={8} className="text-center text-muted py-4">No orders match your filters.</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-3" aria-label="Pagination">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Pagination.Item key={i+1} active={i+1 === currentPage} onClick={() => setPage(i+1)}>
              {i+1}
            </Pagination.Item>
          ))}
        </Pagination>
      )}

      {/* local styles */}
      <style>{`
        .admin-table thead th { position: sticky; top: 0; z-index: 2; }
        .admin-table tbody td, .admin-table thead th { vertical-align: middle; }
      `}</style>
    </div>
  );
}

function Th({ children, activeKey, dir, onClick, nosort }) {
  const isActive = onClick && children && (children.key === activeKey); // not used; safer below
  const btnProps = onClick ? { role:'button', tabIndex:0, onKeyDown:(e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); onClick(); } } } : {};
  const ariaSort = !onClick ? 'none' : (activeKey === (children?.key) ? (dir === 'asc' ? 'ascending' : 'descending') : 'none');
  return (
    <th
      scope="col"
      {...btnProps}
      onClick={onClick}
      aria-sort={nosort ? 'none' : undefined}
      style={{ cursor: onClick ? 'pointer' : 'default', whiteSpace:'nowrap' }}
    >
      {children}
      {!nosort && onClick && <span className="ms-1 text-muted" aria-hidden="true">↕</span>}
    </th>
  );
}
