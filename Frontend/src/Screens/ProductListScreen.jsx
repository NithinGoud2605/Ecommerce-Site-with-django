import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Table, Button, Row, Col, Pagination, Form, InputGroup, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import Loader from '../Components/Loader';         // fixed casing
import Message from '../Components/Message';       // fixed casing
import { setMeta } from '../lib/seo.js';

const fmtUSD = (n) => {
  const v = Number(n || 0);
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(v); }
  catch { return `$${v.toFixed(2)}`; }
};

export default function ProductListScreen() {
  const navigate = useNavigate();
  const userInfo = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch { return null; }
  }, []);

  // table state
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // actions state
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [errorCreate, setErrorCreate] = useState('');
  const [deletingIds, setDeletingIds] = useState(new Set());

  // filters
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('asc');

  // bulk selection
  const [selected, setSelected] = useState(new Set());
  const allSelected = selected.size > 0 && products.every(p => selected.has(p._id));
  const topBarRef = useRef(null);

  useEffect(() => {
    setMeta({ title: 'Products – Admin – Vyshnavi Pelimelli', description: 'Admin: manage products.' });
  }, []);

  // admin guard
  useEffect(() => {
    if (!userInfo || !(userInfo.isAdmin || userInfo.is_staff)) {
      navigate('/login');
    }
  }, [navigate, userInfo]);

  // fetch products (with cancelation)
  const fetchProducts = useCallback(async ({ page: p = 1, keyword: k = '', sortBy: s = 'name', order: o = 'asc' } = {}) => {
    const ctrl = new AbortController();
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.set('page', String(p));
      if (k) params.set('keyword', k);
      if (s) params.set('sort_by', s);
      if (o) params.set('order', o);

      const { data } = await axiosInstance.get(`/api/products/?${params.toString()}`, {
        signal: ctrl.signal,
        headers: userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : undefined
      });

      setProducts(Array.isArray(data?.products) ? data.products : []);
      setPage(data?.page || p);
      setPages(data?.pages || 1);
      setSelected(new Set()); // clear selection on refresh
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      setError(err?.response?.data?.detail || 'Error loading products');
    } finally {
      setLoading(false);
    }
    return () => ctrl.abort();
  }, [userInfo?.token]);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      fetchProducts({ page: 1, keyword, sortBy, order });
    }, 300);
    return () => clearTimeout(t);
  }, [keyword, sortBy, order, fetchProducts]);

  // initial load
  useEffect(() => {
    fetchProducts({ page: 1, keyword, sortBy, order });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // create product
  const createProductHandler = async () => {
    if (!window.confirm('Create a new product?')) return;
    try {
      setLoadingCreate(true);
      setErrorCreate('');
      const { data } = await axiosInstance.post('/api/products/create/', {}, {
        headers: userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : undefined
      });
      const newId = data?._id || data?.id;
      if (newId) navigate(`/admin/product/${newId}/edit`);
      else await fetchProducts({ page, keyword, sortBy, order });
    } catch (err) {
      setErrorCreate(err?.response?.data?.detail || 'Error creating product');
    } finally {
      setLoadingCreate(false);
    }
  };

  // delete one
  const deleteProductHandler = async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      setDeletingIds(prev => new Set(prev).add(id));
      await axiosInstance.delete(`/api/products/delete/${id}/`, {
        headers: userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : undefined
      });
      setProducts(prev => prev.filter(p => p._id !== id)); // optimistic
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error deleting product');
    } finally {
      setDeletingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  // bulk delete
  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected item(s)? This cannot be undone.`)) return;
    try {
      // naive sequential to keep backend simple; can parallelize if desired
      for (const id of selected) {
        await axiosInstance.delete(`/api/products/delete/${id}/`, {
          headers: userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : undefined
        });
      }
      setProducts(prev => prev.filter(p => !selected.has(p._id)));
      setSelected(new Set());
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error deleting selected products');
    }
  };

  // export CSV
  const exportCSV = () => {
    const cols = ['_id', 'name', 'price', 'countInStock', 'category', 'brand', 'createdAt'];
    const head = cols.join(',');
    const rows = products.map(p =>
      cols.map(k => {
        const v = p[k] != null ? String(p[k]) : '';
        // escape csv
        if (/[,"\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
        return v;
      }).join(',')
    );
    const blob = new Blob([head + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_page${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // selection helpers
  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map(p => p._id)));
    }
  };

  const goPage = (p) => {
    setPage(p);
    fetchProducts({ page: p, keyword, sortBy, order });
    // scroll to top of table on page change
    try { topBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
  };

  return (
    <div>
      {/* Sticky toolbar */}
      <div ref={topBarRef} className="py-2 position-sticky" style={{ top: 0, zIndex: 5, background: 'var(--bs-body-bg)' }}>
        <Row className="align-items-center g-2">
          <Col md={4} sm={12}>
            <h1 className="mb-0">Products</h1>
            <div className="text-muted small">Page {page} of {pages}</div>
          </Col>
          <Col md={5} sm={12}>
            <InputGroup>
              <Form.Control
                placeholder="Search name or description…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Form.Select
                aria-label="Sort by"
                value={`${sortBy}_${order}`}
                onChange={(e) => {
                  const [s, o] = e.target.value.split('_');
                  setSortBy(s); setOrder(o);
                }}
              >
                <option value="name_asc">Name (A–Z)</option>
                <option value="name_desc">Name (Z–A)</option>
                <option value="price_asc">Price (Low → High)</option>
                <option value="price_desc">Price (High → Low)</option>
              </Form.Select>
              <Button variant="outline-secondary" onClick={() => { setKeyword(''); setSortBy('name'); setOrder('asc'); }}>
                Reset
              </Button>
            </InputGroup>
          </Col>
          <Col md={3} sm={12} className="d-flex justify-content-md-end gap-2">
            <Button variant="outline-secondary" onClick={exportCSV} title="Export current page to CSV">
              <i className="fas fa-file-export me-2" /> Export
            </Button>
            <Button className="my-0" onClick={createProductHandler} disabled={loadingCreate}>
              {loadingCreate ? <Spinner size="sm" className="me-2" /> : <i className="fas fa-plus me-2" />}
              Create
            </Button>
          </Col>
        </Row>

        {selected.size > 0 && (
          <div className="mt-2 d-flex align-items-center gap-2">
            <Badge bg="dark">{selected.size} selected</Badge>
            <Button size="sm" variant="outline-danger" onClick={bulkDelete}><i className="fas fa-trash me-1" /> Delete selected</Button>
            <div className="text-muted small ms-auto">Tip: Click the checkbox in the header to toggle all.</div>
          </div>
        )}
      </div>

      {errorCreate && <Message variant="danger">{errorCreate}</Message>}

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <Form.Check type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                </th>
                <th style={{ whiteSpace: 'nowrap' }}>ID</th>
                <th>NAME</th>
                <th style={{ width: 120 }}>PRICE</th>
                <th style={{ width: 120 }}>STOCK</th>
                <th>CATEGORY</th>
                <th>BRAND</th>
                <th style={{ width: 170 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const isDeleting = deletingIds.has(product._id);
                return (
                  <tr key={product._id}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selected.has(product._id)}
                        onChange={() => toggleOne(product._id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </td>
                    <td className="text-monospace">{product._id}</td>
                    <td>
                      <div className="fw-semibold">{product.name}</div>
                      <div className="text-muted small text-truncate" style={{ maxWidth: 360 }}>
                        {product.description || '—'}
                      </div>
                    </td>
                    <td>{fmtUSD(product.price)}</td>
                    <td>{Number.isFinite(Number(product.countInStock)) ? Number(product.countInStock) : '—'}</td>
                    <td>{product.category || '—'}</td>
                    <td>{product.brand || '—'}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="light"
                          className="btn-sm"
                          title="Edit"
                          onClick={() => navigate(`/admin/product/${product._id}/edit`)}
                        >
                          <i className="fas fa-edit" />
                        </Button>
                        <Button
                          variant="danger"
                          className="btn-sm"
                          title="Delete"
                          onClick={() => deleteProductHandler(product._id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? <Spinner size="sm" /> : <i className="fas fa-trash" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-5">No products found.</td>
                </tr>
              )}
            </tbody>
          </Table>

          {pages > 1 && (
            <Pagination className="mt-3">
              {Array.from({ length: pages }).map((_, i) => (
                <Pagination.Item key={i + 1} active={i + 1 === page} onClick={() => goPage(i + 1)}>
                  {i + 1}
                </Pagination.Item>
              ))}
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
