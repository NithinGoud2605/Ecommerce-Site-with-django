import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Button, Form, Table, InputGroup, Pagination, Badge, Spinner } from 'react-bootstrap';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { useOutletContext } from 'react-router-dom';
import { setMeta } from '../lib/seo.js';
import axios from '../axiosInstance';

function MediaManager({ productId, onClose }) {
  const [links, setLinks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingAction, setLoadingAction] = React.useState(false);
  const dragIndexRef = React.useRef(-1);

  async function load() {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/products/${productId}/media-links/`);
      setLinks(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }
  React.useEffect(()=>{ load(); }, [productId]);

  async function uploadNew(fileOrList) {
    const files = Array.isArray(fileOrList) ? fileOrList : (fileOrList ? [fileOrList] : []);
    if (files.length === 0) return;
    try {
      setLoadingAction(true);
      for (const file of files) {
        const form = new FormData();
        form.append('file', file);
        const { data: media } = await axios.post('/api/products/media/create/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        await axios.post(`/api/products/${productId}/media-links/create/`, { media_id: media.id, role: 'gallery', position: (links[links.length-1]?.position || 0) + 1 });
      }
      await load();
    } finally { setLoadingAction(false); }
  }

  async function removeLink(id) {
    try { setLoadingAction(true); await axios.delete(`/api/products/media-links/${id}/delete/`); await load(); } finally { setLoadingAction(false); }
  }

  async function saveOrder(next) {
    try {
      setLoadingAction(true);
      await axios.post(`/api/products/${productId}/media-links/reorder/`, { order: next.map(l=>l.id) });
      await load();
    } finally { setLoadingAction(false); }
  }

  function move(idx, dir) {
    const next = links.slice();
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    const t = next[idx]; next[idx] = next[j]; next[j] = t;
    setLinks(next);
  }

  async function setRole(linkId, role) {
    try {
      setLoadingAction(true);
      await axios.put(`/api/products/media-links/${linkId}/`, { role });
      setLinks(prev => prev.map(l => l.id === linkId ? { ...l, role } : l));
    } finally { setLoadingAction(false); }
  }

  async function setHero(linkId) {
    try {
      setLoadingAction(true);
      // Set selected to hero; others to gallery
      await Promise.all(
        links.map(l => axios.put(`/api/products/media-links/${l.id}/`, { role: l.id === linkId ? 'hero' : 'gallery' }))
      );
      await load();
    } finally { setLoadingAction(false); }
  }

  async function updateAlt(mediaId, nextAlt) {
    try {
      setLoadingAction(true);
      await axios.put(`/api/products/media/${mediaId}/`, { alt: nextAlt });
      setLinks(prev => prev.map(l => l.media?.id === mediaId ? { ...l, media: { ...l.media, alt: nextAlt } } : l));
    } finally { setLoadingAction(false); }
  }

  async function updateCaption(linkId, nextCaption) {
    try {
      setLoadingAction(true);
      await axios.put(`/api/products/media-links/${linkId}/`, { caption: nextCaption });
      setLinks(prev => prev.map(l => l.id === linkId ? { ...l, caption: nextCaption } : l));
    } finally { setLoadingAction(false); }
  }

  return (
    <div className="position-fixed top-0 start-0 end-0 bottom-0" style={{ background:'rgba(0,0,0,0.4)', zIndex: 1050 }}>
      <div className="position-absolute top-50 start-50 translate-middle bg-white rounded shadow" style={{ width: 720, maxWidth: '96vw' }}>
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <h5 className="mb-0">Manage Media</h5>
          <div className="d-flex align-items-center gap-2">
            <label className="btn btn-sm btn-outline-secondary mb-0">
              Upload
              <input type="file" accept="image/*" multiple className="d-none" onChange={(e)=> uploadNew(Array.from(e.target.files || []))} />
            </label>
            <Button size="sm" variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
        <div className="p-3" style={{ maxHeight: '70vh', overflow:'auto' }}>
          {loading ? (
            <div className="text-center py-5"><Spinner /></div>
          ) : links.length === 0 ? (
            <div className="text-muted">No media linked. Use Upload to add images.</div>
          ) : (
            <Table size="sm" responsive>
              <thead>
                <tr>
                  <th style={{width:90}}>Preview</th>
                  <th>Alt</th>
                  <th style={{width:140}}>Role</th>
                  <th>Caption</th>
                  <th style={{width:220}}>Order</th>
                  <th style={{width:160}}></th>
                </tr>
              </thead>
              <tbody>
                {links.map((l, idx) => (
                  <tr key={l.id}
                      draggable
                      onDragStart={() => { dragIndexRef.current = idx; }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => { const from = dragIndexRef.current; if (from === -1 || from === idx) return; const next = links.slice(); const [moved] = next.splice(from,1); next.splice(idx,0,moved); dragIndexRef.current = -1; setLinks(next); saveOrder(next); }}
                  >
                    <td>
                      <div style={{width:64,height:64,overflow:'hidden',borderRadius:6,background:'#f3f3f3'}}>
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <img src={l?.media?.file_url || l?.media?.url} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                      </div>
                    </td>
                    <td className="align-middle" style={{minWidth:180}}>
                      <Form.Control size="sm" defaultValue={l?.media?.alt || ''} placeholder="Alt text" onBlur={(e)=>updateAlt(l?.media?.id, e.target.value)} />
                    </td>
                    <td className="align-middle">
                      <Form.Select size="sm" value={l?.role || 'gallery'} onChange={(e)=>setRole(l.id, e.target.value)}>
                        <option value="gallery">Gallery</option>
                        <option value="detail">Detail</option>
                        <option value="hero">Hero</option>
                      </Form.Select>
                    </td>
                    <td className="align-middle" style={{minWidth:200}}>
                      <Form.Control size="sm" defaultValue={l?.caption || ''} placeholder="Caption" onBlur={(e)=>updateCaption(l.id, e.target.value)} />
                    </td>
                    <td className="align-middle">
                      <div className="d-flex gap-2">
                        <Button size="sm" variant="outline-secondary" disabled={idx===0} onClick={()=>{const next=[...links]; move(idx,-1); saveOrder(next);}}>Up</Button>
                        <Button size="sm" variant="outline-secondary" disabled={idx===links.length-1} onClick={()=>{const next=[...links]; move(idx,1); saveOrder(next);}}>Down</Button>
                        <Button size="sm" variant="outline-primary" onClick={()=>setHero(l.id)} disabled={l.role==='hero'}>Set as Hero</Button>
                      </div>
                    </td>
                    <td className="align-middle text-end">
                      <Button size="sm" variant="outline-danger" onClick={()=>removeLink(l.id)} disabled={loadingAction}>Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);
  const { notify } = useOutletContext() || { notify: () => {} };
  
  // UI state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [mediaFor, setMediaFor] = useState(null); // product id for media modal

  const h1Ref = useRef(null);

  useEffect(() => {
    setMeta({ title: 'Products – Admin – Vyshnavi Pelimelli', description: 'Admin: manage products.' });
    let tag = document.querySelector('meta[name="robots"]');
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name','robots'); document.head.appendChild(tag); }
    tag.setAttribute('content','noindex,nofollow');
  }, []);

  async function load() {
    try {
      setLoading(true); setError(null);
      const { data } = await axios.get(`/api/products/?keyword=${encodeURIComponent(search)}&page=1&sort_by=${sortBy}&order=${sortOrder}`);
      setItems(data?.products || []);
      setTimeout(() => h1Ref.current?.focus(), 0);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to load products');
    } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, [search, sortBy, sortOrder]);
  useEffect(()=>{ setPage(1); }, [search, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = useMemo(()=>{ const s=(safePage-1)*pageSize; return items.slice(s,s+pageSize); },[items,safePage,pageSize]);

  async function save(i) {
    const p = visible[i]; if (!p) return;
    try {
      setLoadingAction(true);
      await axios.put(`/api/products/update/${p._id || p.id}/`, {
        name: p.name?.trim() || '',
        price: p.price || 0,
        countInStock: p.countInStock || 0,
        description: p.description || '',
      });
      notify('Product saved successfully');
    } catch (e) {
      notify('Failed to save product: ' + (e?.response?.data?.detail || e?.message || 'Unknown error'));
    } finally { setLoadingAction(false); }
  }

  async function upload(i, file) {
    const p = visible[i]; if (!p || !file) return;
    try {
      setLoadingAction(true);
      const form = new FormData();
      form.append('product_id', String(p._id || p.id));
      form.append('image', file);
      const { data } = await axios.post('/api/products/upload/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      // Merge returned product into our list
      setItems(prev => prev.map(it => (it._id || it.id) === (p._id || p.id) ? { ...it, ...data } : it));
      notify('Image uploaded');
    } catch (e) {
      notify('Failed to upload image: ' + (e?.response?.data?.detail || e?.message || 'Unknown error'));
    } finally { setLoadingAction(false); }
  }

  const onChange = (i, key, value) => {
    setItems(prev => prev.map(it => (it._id || it.id) === (visible[i]?._id || visible[i]?.id) ? { ...it, [key]: value } : it));
  };

  async function addNew() {
    try {
      setLoadingAction(true);
      const { data } = await axios.post('/api/products/create/', {});
      setItems([data, ...items]);
      notify('Product added successfully');
    } catch (e) {
      notify('Failed to add product: ' + (e?.response?.data?.detail || e?.message || 'Unknown error'));
    } finally { setLoadingAction(false); }
  }

  async function duplicate(i) {
    const p = visible[i]; if (!p) return;
    try {
      setLoadingAction(true);
      const copy = { ...p, name: `${p.name || 'Untitled'} (Copy)` };
      const { data } = await axios.post('/api/products/create/', {});
      // quickly update the new record
      await axios.put(`/api/products/update/${data._id || data.id}/`, {
        name: copy.name,
        price: copy.price || 0,
        countInStock: copy.countInStock || 0,
        description: copy.description || '',
      });
      await load();
      notify('Product duplicated successfully');
    } catch (e) {
      notify('Failed to duplicate product: ' + (e?.response?.data?.detail || e?.message || 'Unknown error'));
    } finally { setLoadingAction(false); }
  }

  async function deleteProduct(i) {
    const p = visible[i]; if (!p) return;
    if (!window.confirm(`Delete "${p.name || 'Untitled'}"? This action cannot be undone.`)) return;
    try {
      setLoadingAction(true);
      await axios.delete(`/api/products/delete/${p._id || p.id}/`);
      setItems(prev => prev.filter(it => (it._id || it.id) !== (p._id || p.id)));
      notify('Product deleted successfully');
    } catch (e) {
      notify('Failed to delete product: ' + (e?.response?.data?.detail || e?.message || 'Unknown error'));
    } finally { setLoadingAction(false); }
  }

  const formatDate = (dateString) => { if (!dateString) return '-'; return new Date(dateString).toLocaleDateString(); };

  if (loading) return <Loader />;
  if (error) return <Message variant='danger'>{error}</Message>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 tabIndex={-1} ref={h1Ref}>Products</h1>
        <div className="d-flex align-items-center gap-2">
          <Form.Select size="sm" value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))} aria-label="Rows per page">
            {[10,20,50,100].map(n=> <option key={n} value={n}>{n}/page</option>)}
          </Form.Select>
          <Form.Select size="sm" value={`${sortBy}_${sortOrder}`} onChange={(e)=>{const [f,o]=e.target.value.split('_'); setSortBy(f); setSortOrder(o);}} aria-label="Sort by">
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            <option value="created_at_desc">Newest First</option>
            <option value="created_at_asc">Oldest First</option>
          </Form.Select>
          <InputGroup size="sm">
            <Form.Control placeholder="Search products..." value={search} onChange={(e)=>setSearch(e.target.value)} aria-label="Search products" />
            <Button variant="outline-secondary" onClick={()=>setSearch('')}>Clear</Button>
          </InputGroup>
          <Button size='sm' onClick={addNew} disabled={loadingAction}>{loadingAction ? <Spinner size="sm" /> : 'Add Product'}</Button>
        </div>
      </div>

      <div className="visually-hidden" aria-live="polite">{loading ? 'Loading products…' : `${items.length} products loaded`}</div>

      {items.length === 0 ? (
        <Message variant="info">{search ? 'No products found matching your search.' : 'No products found. Create your first product to get started.'}</Message>
      ) : (
        <>
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead>
              <tr>
                <th style={{width: '100px'}}>ID</th>
                <th style={{width: '120px'}}>IMAGE</th>
                <th>NAME</th>
                <th style={{width: '80px'}}>STOCK</th>
                <th style={{width: '100px'}}>PRICE</th>
                <th>DESCRIPTION</th>
                <th style={{width: '100px'}}>CREATED</th>
                <th style={{width: '260px'}}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p,i)=> (
                <tr key={p._id || p.id}>
                  <td className="text-monospace">{p._id || p.id}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{width:56,height:56,overflow:'hidden',borderRadius:6,background:'#f3f3f3',display:'grid',placeItems:'center'}}>
                        {p.image || p.image_url ? (
                          // eslint-disable-next-line jsx-a11y/alt-text
                          <img src={p.image || p.image_url} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        ) : (
                          <span className="text-muted small">No image</span>
                        )}
                      </div>
                      <label className="btn btn-outline-secondary btn-sm mb-0">
                        Change
                        <input type="file" accept="image/*" className="d-none" onChange={(e)=> upload(i, e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  </td>
                  <td>
                    <Form.Control size="sm" value={p.name || ''} onChange={(e)=>onChange(i,'name',e.target.value)} placeholder="Product name" />
                  </td>
                  <td>
                    <Form.Control type='number' size="sm" value={p.countInStock ?? 0} onChange={(e)=>onChange(i,'countInStock',Number(e.target.value))} />
                  </td>
                  <td>
                    <Form.Control type='number' size="sm" value={p.price ?? 0} onChange={(e)=>onChange(i,'price',Number(e.target.value))} />
                  </td>
                  <td>
                    <Form.Control as='textarea' rows={2} size="sm" value={p.description || ''} onChange={(e)=>onChange(i,'description',e.target.value)} placeholder="Product description" />
                  </td>
                  <td className="small text-muted">{formatDate(p.createdAt || p.created_at)}</td>
                  <td className="d-flex gap-1 flex-wrap">
                    <Button size='sm' variant="outline-primary" onClick={()=>save(i)} disabled={loadingAction}>{loadingAction ? <Spinner size="sm" /> : 'Save'}</Button>
                    <Button size='sm' variant='outline-secondary' onClick={()=>duplicate(i)} disabled={loadingAction}>Copy</Button>
                    <Button size='sm' variant='outline-dark' onClick={()=>setMediaFor(p._id || p.id)} disabled={loadingAction}>Media</Button>
                    <Button size='sm' variant='outline-danger' onClick={()=>deleteProduct(i)} disabled={loadingAction}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {totalPages > 1 && (
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

      {mediaFor && (
        <MediaManager productId={mediaFor} onClose={()=>setMediaFor(null)} />
      )}
    </div>
  );
}


