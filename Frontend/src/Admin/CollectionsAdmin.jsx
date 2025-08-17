import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Button, Form, Table, InputGroup, Pagination, Badge, Spinner, Modal, Card, Image } from 'react-bootstrap';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { useOutletContext } from 'react-router-dom';
import { setMeta } from '../lib/seo.js';
import axios from '../axiosInstance';

export default function CollectionsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);
  const { notify } = useOutletContext() || { notify: () => {} };
  
  // UI state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  
  // Collection details
  const [activeId, setActiveId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const h1Ref = useRef(null);

  useEffect(() => {
    setMeta({ title: 'Collections – Admin – Vyshnavi Pelimelli', description: 'Admin: manage collections.' });
    let tag = document.querySelector('meta[name="robots"]');
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name','robots'); document.head.appendChild(tag); }
    tag.setAttribute('content','noindex,nofollow');
  }, []);

  async function load() {
    try {
      setLoading(true); setError(null);
      const params = new URLSearchParams({ sort_by: sortBy, order: sortOrder });
      const { data } = await axios.get(`/api/products/collections/?${params.toString()}`);
      const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const filtered = search.trim() ? list.filter(c => `${c.title||''} ${c.slug||''} ${c.season||''} ${c.summary||''}`.toLowerCase().includes(search.trim().toLowerCase())) : list;
      setItems(filtered);
      setTimeout(() => h1Ref.current?.focus(), 0);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to load collections');
    } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, [search, sortBy, sortOrder]);
  useEffect(()=>{ setPage(1); }, [search, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = useMemo(()=>{ const s=(safePage-1)*pageSize; return items.slice(s,s+pageSize); },[items,safePage,pageSize]);

  async function loadEntries(collectionId) {
    if (!collectionId) return;
    try {
      setLoadingEntries(true);
      const { data } = await axios.get(`/api/products/collections/${collectionId}/entries/`);
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) { setError(e?.response?.data?.detail || e?.message || 'Failed to load entries'); }
    finally { setLoadingEntries(false); }
  }

  async function save(i) {
    const c = visible[i]; if (!c) return;
    try {
      setLoadingAction(true);
      await axios.put(`/api/products/collections/${c.id}/`, {
        title: c.title?.trim() || '',
        season: c.season?.trim() || '',
        summary: c.summary?.trim() || '',
        hero_media: c.hero_media || null,
        published_at: c.published_at || null,
      });
      notify('Collection saved successfully');
    } catch (e) { notify('Failed to save collection: ' + (e?.response?.data?.detail || e?.message || 'Unknown error')); }
    finally { setLoadingAction(false); }
  }

  const onChange = (i, key, value) => {
    setItems(prev => prev.map(it => it.id === visible[i]?.id ? { ...it, [key]: value } : it));
  };

  async function addNew() {
    try {
      setLoadingAction(true);
      const slug = `collection_${Date.now()}`;
      const { data } = await axios.post('/api/products/collections/create/', { slug, title: 'Untitled Collection', season: '', summary: '' });
      setItems([data, ...items]);
      notify('Collection added successfully');
    } catch (e) { notify('Failed to add collection: ' + (e?.response?.data?.detail || e?.message || 'Unknown error')); }
    finally { setLoadingAction(false); }
  }

  async function deleteCollection(i) {
    const c = visible[i]; if (!c) return;
    if (!window.confirm(`Delete "${c.title || 'Untitled'}"? This action cannot be undone.`)) return;
    try {
      setLoadingAction(true);
      await axios.delete(`/api/products/collections/${c.id}/delete/`);
      setItems(prev => prev.filter(x => x.id !== c.id));
      if (activeId === c.id) { setActiveId(null); setEntries([]); }
      notify('Collection deleted successfully');
    } catch (e) { notify('Failed to delete collection: ' + (e?.response?.data?.detail || e?.message || 'Unknown error')); }
    finally { setLoadingAction(false); }
  }

  const formatDate = (dateString) => { if (!dateString) return '-'; return new Date(dateString).toLocaleDateString(); };
  const isPublished = (publishedAt) => { if (!publishedAt) return false; return new Date(publishedAt) <= new Date(); };
  const getCollectionImage = (heroMedia) => heroMedia?.file_url || '';

  if (loading) return <Loader />;
  if (error) return <Message variant='danger'>{error}</Message>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 tabIndex={-1} ref={h1Ref} className="mb-1">Curated Collections</h1>
          <p className="text-muted mb-0">Precision construction, fluid forms, responsible materials.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="btn-group btn-group-sm" role="group" aria-label="View mode">
            <Button variant={viewMode==='grid'?'primary':'outline-secondary'} size="sm" onClick={()=>setViewMode('grid')}>Grid</Button>
            <Button variant={viewMode==='table'?'primary':'outline-secondary'} size="sm" onClick={()=>setViewMode('table')}>Table</Button>
          </div>
          <Form.Select size="sm" value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))} aria-label="Rows per page" style={{width:'auto'}}>
            {[12,24,48,96].map(n=> <option key={n} value={n}>{n}/page</option>)}
          </Form.Select>
          <Form.Select size="sm" value={`${sortBy}_${sortOrder}`} onChange={(e)=>{ const [f,o]=e.target.value.split('_'); setSortBy(f); setSortOrder(o); }} aria-label="Sort by" style={{width:'auto'}}>
            <option value="createdAt_desc">Newest First</option>
            <option value="createdAt_asc">Oldest First</option>
            <option value="title_asc">Title A-Z</option>
            <option value="title_desc">Title Z-A</option>
            <option value="published_at_desc">Published First</option>
            <option value="published_at_asc">Draft First</option>
          </Form.Select>
          <InputGroup size="sm" style={{width:'auto'}}>
            <Form.Control placeholder="Search collections..." value={search} onChange={(e)=>setSearch(e.target.value)} aria-label="Search collections" />
            <Button variant="outline-secondary" onClick={()=>setSearch('')}>Clear</Button>
          </InputGroup>
          <Button size='sm' onClick={addNew} disabled={loadingAction}>{loadingAction ? <Spinner size="sm" /> : <>Add Collection</>}</Button>
        </div>
      </div>

      <div className="visually-hidden" aria-live="polite">{loading ? 'Loading collections…' : `${items.length} collections loaded`}</div>

      {items.length === 0 ? (
        <Message variant="info">{search ? 'No collections found matching your search.' : 'No collections found. Create your first collection to get started.'}</Message>
      ) : viewMode === 'grid' ? (
        <div>
          <div className="row g-4">
            {visible.map((c,i)=> (
              <div key={c.id} className="col-12 col-md-6 col-lg-4">
                <Card className="h-100 shadow-sm border-0 overflow-hidden" style={{cursor:'pointer', background: activeId===c.id?'#f8f9fa':undefined, transition:'all .3s ease'}} onClick={()=>{ setActiveId(c.id); loadEntries(c.id); }}>
                  <div className="position-relative">
                    <Image src={getCollectionImage(c.hero_media)} alt={c.title||'Collection'} className="w-100" style={{height:'280px', objectFit:'cover', transition:'transform .3s ease'}} onMouseEnter={(e)=> e.currentTarget.style.transform='scale(1.03)'} onMouseLeave={(e)=> e.currentTarget.style.transform='scale(1)'} />
                    <div className="position-absolute top-0 start-0 p-3">
                      <Badge bg={isPublished(c.published_at)?'success':'secondary'} className="mb-2">{isPublished(c.published_at)?'Live':'Draft'}</Badge>
                    </div>
                    <div className="position-absolute bottom-0 start-0 end-0 p-3" style={{background:'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)'}}>
                      <h5 className="text-white mb-1">{c.title || 'Untitled Collection'}</h5>
                      {c.season && <small className="text-white-50">{c.season}</small>}
                    </div>
                  </div>
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <small className="text-muted">Slug: {c.slug}</small>
                      <small className="text-muted">{formatDate(c.createdAt)}</small>
                    </div>
                    {c.summary && (<p className="small text-muted mb-3" style={{display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{c.summary}</p>)}
                    <div className="d-flex gap-1">
                      <Button size='sm' variant="outline-primary" onClick={(e)=>{ e.stopPropagation(); save(i); }} disabled={loadingAction}>{loadingAction ? <Spinner size="sm" /> : 'Save'}</Button>
                      <Button size='sm' variant='outline-danger' onClick={(e)=>{ e.stopPropagation(); deleteCollection(i); }} disabled={loadingAction}>Delete</Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
          {totalPages>1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First onClick={()=>setPage(1)} disabled={safePage===1} />
                <Pagination.Prev onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={safePage===1} />
                {Array.from({length:totalPages}).map((_,i)=>(
                  <Pagination.Item key={i+1} active={i+1===safePage} onClick={()=>setPage(i+1)}>{i+1}</Pagination.Item>
                ))}
                <Pagination.Next onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={safePage===totalPages} />
                <Pagination.Last onClick={()=>setPage(totalPages)} disabled={safePage===totalPages} />
              </Pagination>
            </div>
          )}
        </div>
      ) : (
        <div className='d-flex gap-4'>
          <div className='flex-grow-1'>
            <Table striped bordered hover responsive className="table-sm align-middle">
              <thead>
                <tr>
                  <th style={{width:'120px'}}>SLUG</th>
                  <th>TITLE</th>
                  <th style={{width:'100px'}}>SEASON</th>
                  <th>SUMMARY</th>
                  <th style={{width:'120px'}}>STATUS</th>
                  <th style={{width:'100px'}}>CREATED</th>
                  <th style={{width:'180px'}}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c,i)=>(
                  <tr key={c.id} onClick={()=>{ setActiveId(c.id); loadEntries(c.id); }} style={{cursor:'pointer', background: activeId===c.id?'#f8f9fa':undefined}}>
                    <td className="text-truncate" title={c.slug}><code className="small">{c.slug}</code></td>
                    <td><Form.Control size="sm" value={c.title||''} onChange={(e)=>onChange(i,'title',e.target.value)} placeholder="Collection title" onClick={(e)=>e.stopPropagation()} /></td>
                    <td><Form.Control size="sm" value={c.season||''} onChange={(e)=>onChange(i,'season',e.target.value)} placeholder="Season" onClick={(e)=>e.stopPropagation()} /></td>
                    <td><Form.Control as='textarea' rows={2} size="sm" value={c.summary||''} onChange={(e)=>onChange(i,'summary',e.target.value)} placeholder="Collection summary" onClick={(e)=>e.stopPropagation()} /></td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Form.Control type='datetime-local' size="sm" value={c.published_at ? new Date(c.published_at).toISOString().slice(0, 16) : ''} onChange={(e)=>onChange(i,'published_at', e.target.value? new Date(e.target.value).toISOString(): null)} onClick={(e)=>e.stopPropagation()} />
                        <Badge bg={isPublished(c.published_at)?'success':'secondary'}>{isPublished(c.published_at)?'Live':'Draft'}</Badge>
                      </div>
                    </td>
                    <td className="small text-muted">{formatDate(c.createdAt)}</td>
                    <td className="d-flex gap-1">
                      <Button size='sm' variant="outline-primary" onClick={(e)=>{ e.stopPropagation(); save(i); }} disabled={loadingAction}>{loadingAction ? <Spinner size="sm" /> : 'Save'}</Button>
                      <Button size='sm' variant='outline-danger' onClick={(e)=>{ e.stopPropagation(); deleteCollection(i); }} disabled={loadingAction}>Delete</Button>
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
          </div>

          <div style={{ minWidth: 360 }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Entries {activeId ? '' : '(select a collection)'}</h6>
            </div>
            {loadingEntries ? (
              <Loader />
            ) : entries.length === 0 ? (
              <Message variant="info" className="small">{activeId ? 'No entries in this collection.' : 'Select a collection to view entries.'}</Message>
            ) : (
              <Table size='sm' hover className="border">
                <thead className="table-light">
                  <tr>
                    <th style={{width:'40px'}}>#</th>
                    <th>Caption</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e,i)=>(
                    <tr key={e.id}>
                      <td className="text-muted small">{i+1}</td>
                      <td className="text-truncate" title={e.caption}>{e.caption || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


