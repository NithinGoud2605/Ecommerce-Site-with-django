import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Button, Form, Table, InputGroup, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import Message from '../Components/Message';
import Loader from '../Components/Loader';
import { useOutletContext } from 'react-router-dom';
import { setMeta } from '../lib/seo.js';

export default function PagesAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);
  const { notify } = useOutletContext() || { notify: () => {} };
  
  // UI state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('slug');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterPublished, setFilterPublished] = useState('');

  // Modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  // a11y: focus heading when content ready
  const h1Ref = useRef(null);

  // Meta + noindex for admin pages
  useEffect(() => {
    setMeta({ title: 'Pages – Admin – Vyshnavi Pelimelli', description: 'Admin: manage pages.' });
    let tag = document.querySelector('meta[name="robots"]');
    if (!tag) { 
      tag = document.createElement('meta'); 
      tag.setAttribute('name','robots'); 
      document.head.appendChild(tag); 
    }
    tag.setAttribute('content','noindex,nofollow');
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('pages')
        .select('id, slug, title, hero_path, body_md, published_at, is_published, created_at, updated_at')
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply search filter
      if (search.trim()) {
        query = query.or(`title.ilike.%${search.trim()}%,slug.ilike.%${search.trim()}%,body_md.ilike.%${search.trim()}%`);
      }

      // Apply published filter
      if (filterPublished === 'published') {
        query = query.or('published_at.not.is.null,is_published.eq.true');
      } else if (filterPublished === 'draft') {
        query = query.and('published_at.is.null,is_published.eq.false');
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setItems(data || []);
      setLoading(false);
      
      // Focus heading after load for accessibility
      setTimeout(() => h1Ref.current?.focus(), 0);
    } catch (e) {
      setError(e?.message || 'Failed to load pages');
      setLoading(false);
    }
  }

  useEffect(() => { 
    load(); 
  }, [search, sortBy, sortOrder, filterPublished]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, sortBy, sortOrder, filterPublished]);

  // Derived: paginated view
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  async function save(page) {
    try {
      setLoadingAction(true);
      const { id, ...rest } = page;
      const { error } = await supabase
        .from('pages')
        .upsert({ id, ...rest });
      
      if (error) throw error;
      notify('Page saved successfully');
    } catch (e) {
      throw new Error('Save failed: ' + (e?.message || 'Unknown error'));
    } finally {
      setLoadingAction(false);
    }
  }

  function onFieldChange(i, key, value) {
    setItems((prev) => prev.map((it) => 
      it.id === visible[i]?.id ? { ...it, [key]: value } : it
    ));
  }

  async function handleSave(i) {
    try {
      await save(visible[i]);
      await load();
    } catch (e) {
      setError(e?.message || 'Save failed');
    }
  }

  async function addNew() {
    try {
      setLoadingAction(true);
      const slug = `page_${Date.now()}`;
      const { data, error } = await supabase
        .from('pages')
        .insert({ 
          slug, 
          title: 'Untitled Page', 
          hero_path: '',
          body_md: '# New Page\n\nStart writing your content here...',
          published_at: null,
          is_published: false
        })
        .select('id, slug, title, hero_path, body_md, published_at, is_published, created_at, updated_at')
        .single();
      
      if (error) throw error;
      setItems([data, ...items]);
      notify('Page added successfully');
    } catch (e) {
      setError('Failed to add page: ' + (e?.message || 'Unknown error'));
    } finally {
      setLoadingAction(false);
    }
  }

  async function deletePage(i) {
    const p = visible[i];
    if (!p) return;
    
    if (!window.confirm(`Delete "${p.title || p.slug}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoadingAction(true);
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', p.id);
      
      if (error) throw error;
      setItems(prev => prev.filter(item => item.id !== p.id));
      notify('Page deleted successfully');
    } catch (e) {
      setError('Failed to delete page: ' + (e?.message || 'Unknown error'));
    } finally {
      setLoadingAction(false);
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const isPublished = (page) => {
    return page.published_at || page.is_published;
  };

  const previewMarkdown = (content) => {
    // Simple markdown preview - in production you might want a proper markdown renderer
    return content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>');
  };

  if (loading) return <Loader />;
  if (error) return <Message variant='danger'>{error}</Message>;

  return (
    <div>
      {/* Header with search and controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 tabIndex={-1} ref={h1Ref}>Pages</h1>
        <div className="d-flex align-items-center gap-2">
          <Form.Select
            size="sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}/page</option>)}
          </Form.Select>
          <Form.Select
            size="sm"
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('_');
              setSortBy(field);
              setSortOrder(order);
            }}
            aria-label="Sort by"
          >
            <option value="slug_asc">Slug A-Z</option>
            <option value="slug_desc">Slug Z-A</option>
            <option value="title_asc">Title A-Z</option>
            <option value="title_desc">Title Z-A</option>
            <option value="created_at_desc">Newest First</option>
            <option value="created_at_asc">Oldest First</option>
            <option value="updated_at_desc">Recently Updated</option>
          </Form.Select>
          <Form.Select
            size="sm"
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All Pages</option>
            <option value="published">Published Only</option>
            <option value="draft">Draft Only</option>
          </Form.Select>
          <InputGroup size="sm">
            <Form.Control
              placeholder="Search pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search pages"
            />
            <Button variant="outline-secondary" onClick={() => setSearch('')}>Clear</Button>
          </InputGroup>
          <Button size='sm' onClick={addNew} disabled={loadingAction}>
            {loadingAction ? <Spinner size="sm" /> : 'Add Page'}
          </Button>
        </div>
      </div>

      {/* a11y: announce results count */}
      <div className="visually-hidden" aria-live="polite">
        {loading ? 'Loading pages…' : `${items.length} pages loaded`}
      </div>

      {items.length === 0 ? (
        <Message variant="info">
          {search || filterPublished ? 'No pages found matching your filters.' : 'No pages found. Create your first page to get started.'}
        </Message>
      ) : (
        <>
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead>
              <tr>
                <th style={{width: '120px'}}>SLUG</th>
                <th>TITLE</th>
                <th style={{width: '120px'}}>HERO IMAGE</th>
                <th>CONTENT PREVIEW</th>
                <th style={{width: '100px'}}>STATUS</th>
                <th style={{width: '100px'}}>UPDATED</th>
                <th style={{width: '200px'}}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p, i) => (
                <tr key={p.id}>
                  <td>
                    <code className="small text-truncate d-block" title={p.slug}>
                      {p.slug}
                    </code>
                  </td>
                  <td>
                    <Form.Control 
                      size="sm"
                      value={p.title || ''} 
                      onChange={(e) => onFieldChange(i, 'title', e.target.value)}
                      placeholder="Page title"
                    />
                  </td>
                  <td>
                    <Form.Control 
                      size="sm"
                      value={p.hero_path || ''} 
                      onChange={(e) => onFieldChange(i, 'hero_path', e.target.value)}
                      placeholder="Hero image path"
                    />
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="text-truncate" style={{ maxWidth: '200px' }}>
                        {p.body_md ? p.body_md.substring(0, 100) + (p.body_md.length > 100 ? '...' : '') : 'No content'}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline-secondary"
                        onClick={() => {
                          setPreviewContent(p.body_md || '');
                          setShowPreviewModal(true);
                        }}
                      >
                        Preview
                      </Button>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Check
                        type='switch'
                        id={`pub-${p.id}`}
                        checked={isPublished(p)}
                        onChange={(e) => {
                          if ('published_at' in p) {
                            onFieldChange(i, 'published_at', e.target.checked ? new Date().toISOString() : null);
                          } else {
                            onFieldChange(i, 'is_published', e.target.checked);
                          }
                        }}
                        aria-label={`${isPublished(p) ? 'Published' : 'Draft'} page`}
                      />
                      <Badge bg={isPublished(p) ? 'success' : 'secondary'}>
                        {isPublished(p) ? 'Live' : 'Draft'}
                      </Badge>
                    </div>
                  </td>
                  <td className="small text-muted">
                    {formatDate(p.updated_at || p.created_at)}
                  </td>
                  <td className="d-flex gap-1">
                    <Button 
                      size='sm' 
                      variant="outline-primary"
                      onClick={() => handleSave(i)}
                      disabled={loadingAction}
                    >
                      {loadingAction ? <Spinner size="sm" /> : 'Save'}
                    </Button>
                    <Button 
                      size='sm' 
                      variant='outline-danger' 
                      onClick={() => deletePage(i)}
                      disabled={loadingAction}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-3">
              <Pagination.First onClick={() => setPage(1)} disabled={safePage === 1} />
              <Pagination.Prev onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} />
              {Array.from({ length: totalPages }).map((_, i) => (
                <Pagination.Item
                  key={i + 1}
                  active={i + 1 === safePage}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} />
              <Pagination.Last onClick={() => setPage(totalPages)} disabled={safePage === totalPages} />
            </Pagination>
          )}
        </>
      )}

      {/* Content Editor Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Content Editor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Markdown Content</Form.Label>
            <Form.Control
              as="textarea"
              rows={15}
              value={previewContent}
              onChange={(e) => setPreviewContent(e.target.value)}
              placeholder="Write your markdown content here..."
            />
          </Form.Group>
          <div className="mt-3">
            <h6>Preview:</h6>
            <div 
              className="border p-3 bg-light"
              dangerouslySetInnerHTML={{ __html: previewMarkdown(previewContent) }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}


