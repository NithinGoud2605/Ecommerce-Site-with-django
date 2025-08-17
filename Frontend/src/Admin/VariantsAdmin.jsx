import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Button, Form, Table, InputGroup, Pagination, Badge, Spinner } from 'react-bootstrap';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { useOutletContext } from 'react-router-dom';
import { setMeta } from '../lib/seo.js';
import axios from '../axiosInstance';

export default function VariantsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);
  const { notify } = useOutletContext() || { notify: () => {} };
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('product_id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterProduct, setFilterProduct] = useState('');

  const h1Ref = useRef(null);

  useEffect(() => {
    setMeta({ title: 'Variants – Admin – Vyshnavi Pelimelli', description: 'Admin: manage product variants.' });
    let tag = document.querySelector('meta[name="robots"]');
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name','robots'); document.head.appendChild(tag); }
    tag.setAttribute('content','noindex,nofollow');
  }, []);

  async function load() {
    try {
      setLoading(true); setError(null);
      const params = new URLSearchParams({ sort_by: sortBy, order: sortOrder });
      if (filterProduct) params.set('product_id', filterProduct);
      const { data } = await axios.get(`/api/products/variants/?${params.toString()}`);
      let list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(v => `${v.sku||''} ${v.size||''} ${v.color||''}`.toLowerCase().includes(q));
      }
      setItems(list);
      setTimeout(() => h1Ref.current?.focus(), 0);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to load variants');
    } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, [search, sortBy, sortOrder, filterProduct]);
  useEffect(()=>{ setPage(1); }, [search, sortBy, sortOrder, filterProduct]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = useMemo(()=>{ const s=(safePage-1)*pageSize; return items.slice(s,s+pageSize); },[items,safePage,pageSize]);

  async function save(i) {
    const v = visible[i]; if (!v) return;
    try {
      setLoadingAction(true);
      await axios.put(`/api/products/variants/${v.id}/`, {
        sku: v.sku?.trim() || '',
        size: v.size?.trim() || '',
        color: v.color?.trim() || '',
        price_cents: v.price_cents || 0,
        currency: v.currency || 'USD',
        stock: v.stock || 0,
        position: v.position || 0
      });
      notify('Variant saved successfully');
    } catch (e) { notify('Failed to save variant: ' + (e?.response?.data?.detail || e?.message || 'Unknown error')); }
    finally { setLoadingAction(false); }
  }

  const onChange = (i, key, value) => {
    setItems(prev => prev.map(it => it.id === visible[i]?.id ? { ...it, [key]: value } : it));
  };

  async function addNew() {
    try {
      setLoadingAction(true);
      const payload = {
        product: filterProduct || null,
        sku: `SKU_${Date.now()}`,
        size: '',
        color: '',
        price_cents: 0,
        currency: 'USD',
        stock: 0,
        position: 0
      };
      const { data } = await axios.post('/api/products/variants/create/', payload);
      setItems([data, ...items]);
      notify('Variant added successfully');
    } catch (e) { notify('Failed to add variant: ' + (e?.response?.data?.detail || e?.message || 'Unknown error')); }
    finally { setLoadingAction(false); }
  }

  async function deleteVariant(i) {
    const v = visible[i]; if (!v) return;
    if (!window.confirm(`Delete variant "${v.sku || 'Untitled'}"? This action cannot be undone.`)) return;
    try {
      setLoadingAction(true);
      await axios.delete(`/api/products/variants/${v.id}/delete/`);
      setItems(prev => prev.filter(x => x.id !== v.id));
      notify('Variant deleted successfully');
    } catch (e) { notify('Failed to delete variant: ' + (e?.response?.data?.detail || e?.message || 'Unknown error')); }
    finally { setLoadingAction(false); }
  }

  const formatPrice = (cents, currency='USD') => new Intl.NumberFormat('en-US', { style:'currency', currency }).format((cents||0)/100);
  const formatDate = (dateString) => { if (!dateString) return '-'; return new Date(dateString).toLocaleDateString(); };

  if (loading) return <Loader />;
  if (error) return <Message variant='danger'>{error}</Message>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 tabIndex={-1} ref={h1Ref}>Product Variants</h1>
        <div className="d-flex align-items-center gap-2">
          <Form.Select size="sm" value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))} aria-label="Rows per page">
            {[10,20,50,100].map(n=> <option key={n} value={n}>{n}/page</option>)}
          </Form.Select>
          <Form.Select size="sm" value={`${sortBy}_${sortOrder}`} onChange={(e)=>{ const [f,o]=e.target.value.split('_'); setSortBy(f); setSortOrder(o); }} aria-label="Sort by">
            <option value="product_id_asc">Product ID A-Z</option>
            <option value="product_id_desc">Product ID Z-A</option>
            <option value="position_asc">Position Low-High</option>
            <option value="position_desc">Position High-Low</option>
            <option value="price_cents_asc">Price Low-High</option>
            <option value="price_cents_desc">Price High-Low</option>
            <option value="createdAt_desc">Newest First</option>
            <option value="createdAt_asc">Oldest First</option>
          </Form.Select>
          <InputGroup size="sm">
            <Form.Control placeholder="Filter by product ID..." value={filterProduct} onChange={(e)=>setFilterProduct(e.target.value)} aria-label="Filter by product" />
            <Button variant="outline-secondary" onClick={()=>setFilterProduct('')}>Clear</Button>
          </InputGroup>
          <InputGroup size="sm">
            <Form.Control placeholder="Search variants..." value={search} onChange={(e)=>setSearch(e.target.value)} aria-label="Search variants" />
            <Button variant="outline-secondary" onClick={()=>setSearch('')}>Clear</Button>
          </InputGroup>
          <Button size='sm' onClick={addNew} disabled={loadingAction}>{loadingAction ? <Spinner size="sm" /> : 'Add Variant'}</Button>
        </div>
      </div>

      <div className="visually-hidden" aria-live="polite">{loading ? 'Loading variants…' : `${items.length} variants loaded`}</div>

      {items.length === 0 ? (
        <Message variant="info">{search || filterProduct ? 'No variants found matching your filters.' : 'No variants found. Create your first variant to get started.'}</Message>
      ) : (
        <>
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead>
              <tr>
                <th style={{width:'100px'}}>PRODUCT ID</th>
                <th style={{width:'120px'}}>SKU</th>
                <th style={{width:'80px'}}>SIZE</th>
                <th style={{width:'80px'}}>COLOR</th>
                <th style={{width:'100px'}}>PRICE</th>
                <th style={{width:'80px'}}>CURRENCY</th>
                <th style={{width:'80px'}}>STOCK</th>
                <th style={{width:'60px'}}>POS</th>
                <th style={{width:'120px'}}>CREATED</th>
                <th style={{width:'200px'}}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((v,i)=> (
                <tr key={v.id}>
                  <td><Badge bg="secondary">{v.product}</Badge></td>
                  <td><Form.Control size="sm" value={v.sku||''} onChange={(e)=>onChange(i,'sku',e.target.value)} placeholder="SKU" /></td>
                  <td><Form.Control size="sm" value={v.size||''} onChange={(e)=>onChange(i,'size',e.target.value)} placeholder="Size" /></td>
                  <td><Form.Control size="sm" value={v.color||''} onChange={(e)=>onChange(i,'color',e.target.value)} placeholder="Color" /></td>
                  <td>
                    <Form.Control type='number' size="sm" value={v.price_cents ?? 0} onChange={(e)=>onChange(i,'price_cents',Number(e.target.value))} min="0" step="1" />
                    <div className="small text-muted">{formatPrice(v.price_cents, v.currency)}</div>
                  </td>
                  <td>
                    <Form.Select size="sm" value={v.currency||'USD'} onChange={(e)=>onChange(i,'currency',e.target.value)}>
                      <option value='USD'>USD</option>
                      <option value='EUR'>EUR</option>
                      <option value='GBP'>GBP</option>
                      <option value='CAD'>CAD</option>
                    </Form.Select>
                  </td>
                  <td>
                    <Form.Control type='number' size="sm" value={v.stock ?? 0} onChange={(e)=>onChange(i,'stock',Number(e.target.value))} min="0" step="1" />
                    <Badge bg={v.stock>0?'success':'danger'} className="small">{v.stock>0?'In Stock':'Out of Stock'}</Badge>
                  </td>
                  <td><Form.Control type='number' size="sm" value={v.position ?? 0} onChange={(e)=>onChange(i,'position',Number(e.target.value))} min="0" step="1" /></td>
                  <td className="small text-muted">{formatDate(v.createdAt)}</td>
                  <td className="d-flex gap-1">
                    <Button size='sm' variant="outline-primary" onClick={()=>save(i)} disabled={loadingAction}>{loadingAction ? <Spinner size="sm" /> : 'Save'}</Button>
                    <Button size='sm' variant='outline-danger' onClick={()=>deleteVariant(i)} disabled={loadingAction}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {totalPages>1 && (
            <Pagination className="mt-3">
              <Pagination.First onClick={()=>setPage(1)} disabled={safePage===1} />
              <Pagination.Prev onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={safePage===1} />
              {Array.from({length:totalPages}).map((_,i)=>(
                <Pagination.Item key={i+1} active={i+1===safePage} onClick={()=>setPage(i+1)}>{i+1}</Pagination.Item>
              ))}
              <Pagination.Next onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={safePage===totalPages} />
              <Pagination.Last onClick={()=>setPage(totalPages)} disabled={safePage===totalPages} />
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}


