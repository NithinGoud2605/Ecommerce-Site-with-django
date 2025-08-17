import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Button, Form, Image, Table, Modal, InputGroup, Pagination, Badge, Spinner, Alert } from 'react-bootstrap';
import Message from '../Components/Message';
import Loader from '../Components/Loader';
import { useOutletContext } from 'react-router-dom';
import { setMeta } from '../lib/seo.js';
import axios from '../axiosInstance';

export default function MediaAdmin() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Upload state
  const [file, setFile] = useState(null);
  const [alt, setAlt] = useState('');
  const [role, setRole] = useState('gallery');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // UI state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('position');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterRole, setFilterRole] = useState('');

  const { notify } = useOutletContext() || { notify: () => {} };

  const h1Ref = useRef(null);

  useEffect(() => {
    setMeta({ title: 'Media – Admin – Vyshnavi Pelimelli', description: 'Admin: manage media files.' });
    let tag = document.querySelector('meta[name="robots"]');
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name','robots'); document.head.appendChild(tag); }
    tag.setAttribute('content','noindex,nofollow');
  }, []);

  async function load() {
    try {
      setLoading(true); setError(null);
      const params = new URLSearchParams();
      if (filterRole) params.set('role', filterRole);
      params.set('sort_by', sortBy);
      params.set('order', sortOrder);
      const { data } = await axios.get(`/api/products/media/?${params.toString()}`);
      const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const filtered = search.trim() ? list.filter(m => `${m.alt||''} ${m.file}`.toLowerCase().includes(search.trim().toLowerCase())) : list;
      setItems(filtered);
      setTimeout(() => h1Ref.current?.focus(), 0);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to load media');
    } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, [search, sortBy, sortOrder, filterRole]);
  useEffect(()=>{ setPage(1); }, [search, sortBy, sortOrder, filterRole]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = useMemo(()=>{ const s=(safePage-1)*pageSize; return items.slice(s,s+pageSize); },[items,safePage,pageSize]);

  async function upload() {
    if (!file) return;
    if (!alt.trim()) { setError('Alt text is required'); return; }
    try {
      setLoadingAction(true); setUploadProgress(0);
      const form = new FormData();
      form.append('file', file);
      form.append('alt', alt.trim());
      form.append('role', role);
      const { data } = await axios.post('/api/products/media/create/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / (p.total || 1)))
      });
      setFile(null); setAlt(''); setUploadProgress(100);
      await load();
      notify('Media uploaded successfully');
    } catch (e) {
      setError('Upload failed: ' + (e?.response?.data?.detail || e?.message || 'Unknown error'));
    } finally { setLoadingAction(false); setUploadProgress(0); }
  }

  async function updateItem(id, patch) {
    try {
      await axios.put(`/api/products/media/${id}/`, patch);
      notify('Media updated successfully');
    } catch (e) {
      setError('Update failed: ' + (e?.response?.data?.detail || e?.message || 'Unknown error'));
    }
  }

  async function deleteMedia(i) {
    const m = visible[i]; if (!m) return;
    if (!window.confirm(`Delete "${m.alt || m.file}"? This action cannot be undone.`)) return;
    try {
      setLoadingAction(true);
      await axios.delete(`/api/products/media/${m.id}/delete/`);
      setItems(prev => prev.filter(x => x.id !== m.id));
      notify('Media deleted successfully');
    } catch (e) {
      setError('Delete failed: ' + (e?.response?.data?.detail || e?.message || 'Unknown error'));
    } finally { setLoadingAction(false); }
  }

  const formatDate = (dateString) => { if (!dateString) return '-'; return new Date(dateString).toLocaleDateString(); };

  const getImageUrl = (m) => m?.file_url || '';

  if (loading) return <Loader />;
  if (error) return <Message variant='danger'>{error}</Message>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 tabIndex={-1} ref={h1Ref}>Media Library</h1>
        <div className="d-flex align-items-center gap-2">
          <Form.Select size="sm" value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))} aria-label="Rows per page">
            {[10,20,50,100].map(n=> <option key={n} value={n}>{n}/page</option>)}
          </Form.Select>
          <Form.Select size="sm" value={`${sortBy}_${sortOrder}`} onChange={(e)=>{ const [f,o]=e.target.value.split('_'); setSortBy(f); setSortOrder(o); }} aria-label="Sort by">
            <option value="position_asc">Position Low-High</option>
            <option value="position_desc">Position High-Low</option>
            <option value="createdAt_desc">Newest First</option>
            <option value="createdAt_asc">Oldest First</option>
            <option value="alt_asc">Alt Text A-Z</option>
            <option value="alt_desc">Alt Text Z-A</option>
          </Form.Select>
          <Form.Select size="sm" value={filterRole} onChange={(e)=>setFilterRole(e.target.value)} aria-label="Filter by role">
            <option value="">All Roles</option>
            <option value="gallery">Gallery</option>
            <option value="hero">Hero</option>
          </Form.Select>
          <InputGroup size="sm">
            <Form.Control placeholder="Search media..." value={search} onChange={(e)=>setSearch(e.target.value)} aria-label="Search media" />
            <Button variant="outline-secondary" onClick={()=>setSearch('')}>Clear</Button>
          </InputGroup>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header"><h5 className="mb-0">Upload New Media</h5></div>
        <div className="card-body">
          <div className='d-flex gap-2 align-items-end flex-wrap'>
            <Form.Group className="mb-0">
              <Form.Label className="small">File</Form.Label>
              <Form.Control type='file' onChange={(e)=>setFile(e.target.files?.[0]||null)} style={{maxWidth:300}} accept="image/*" />
            </Form.Group>
            <Form.Group className="mb-0">
              <Form.Label className="small">Alt Text *</Form.Label>
              <Form.Control placeholder='Describe the image' value={alt} onChange={(e)=>setAlt(e.target.value)} style={{maxWidth:300}} required />
            </Form.Group>
            <Form.Group className="mb-0">
              <Form.Label className="small">Role</Form.Label>
              <Form.Select value={role} onChange={(e)=>setRole(e.target.value)} style={{maxWidth:160}}>
                <option value='gallery'>Gallery</option>
                <option value='hero'>Hero</option>
              </Form.Select>
            </Form.Group>
            <Button onClick={upload} disabled={!file || !alt.trim() || loadingAction} className="mb-0">
              {loadingAction ? (<><Spinner size="sm" className="me-2" />{uploadProgress < 50 ? 'Uploading...' : 'Processing...'}</>) : 'Upload'}
            </Button>
          </div>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2">
              <div className="progress" style={{height:'4px'}}>
                <div className="progress-bar" style={{width:`${uploadProgress}%`}} role="progressbar" aria-valuenow={uploadProgress} aria-valuemin="0" aria-valuemax="100" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="visually-hidden" aria-live="polite">{loading ? 'Loading media…' : `${items.length} media files loaded`}</div>

      {items.length === 0 ? (
        <Message variant="info">{search || filterRole ? 'No media found matching your filters.' : 'No media files found. Upload your first image to get started.'}</Message>
      ) : (
        <>
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead>
              <tr>
                <th style={{width:'80px'}}>PREVIEW</th>
                <th>FILE</th>
                <th>ALT TEXT</th>
                <th style={{width:'100px'}}>ROLE</th>
                <th style={{width:'60px'}}>POS</th>
                <th style={{width:'100px'}}>CREATED</th>
                <th style={{width:'200px'}}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((m,i)=> (
                <tr key={m.id}>
                  <td>
                    <Image src={getImageUrl(m)} alt={m.alt||''} style={{width:60,height:60,objectFit:'cover'}} className="border" />
                  </td>
                  <td className="text-truncate" title={m.file}><code className="small">{m.file}</code></td>
                  <td>
                    <Form.Control size="sm" value={m.alt||''} onChange={(e)=>{ const v=e.target.value; setItems(prev=>prev.map(x=>x.id===m.id?{...x,alt:v}:x)); }} onBlur={()=>updateItem(m.id,{ alt: items.find(x=>x.id===m.id)?.alt || '' })} placeholder="Alt text" />
                  </td>
                  <td>
                    <Form.Select size="sm" value={m.role||'gallery'} onChange={async (e)=>{ const v=e.target.value; setItems(prev=>prev.map(x=>x.id===m.id?{...x,role:v}:x)); await updateItem(m.id,{ role:v }); }}>
                      <option value='gallery'>Gallery</option>
                      <option value='hero'>Hero</option>
                    </Form.Select>
                    <Badge bg={m.role==='hero'?'primary':'secondary'} className="small mt-1">{m.role||'gallery'}</Badge>
                  </td>
                  <td>
                    <Form.Control type="number" size="sm" value={m.position||0} onChange={(e)=>{ const v=Number(e.target.value); setItems(prev=>prev.map(x=>x.id===m.id?{...x,position:v}:x)); }} onBlur={()=>updateItem(m.id,{ position: items.find(x=>x.id===m.id)?.position || 0 })} min="0" step="1" />
                  </td>
                  <td className="small text-muted">{formatDate(m.createdAt)}</td>
                  <td className="d-flex gap-1">
                    <Button size='sm' variant='outline-danger' onClick={()=>deleteMedia(i)} disabled={loadingAction}>Delete</Button>
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
    </div>
  );
}


