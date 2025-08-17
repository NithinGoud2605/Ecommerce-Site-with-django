import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner, Image, Table, InputGroup, Badge } from 'react-bootstrap';
import axiosInstance from '../axiosInstance';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { setMeta } from '../lib/seo.js';

function ProductEditScreen() {
  const { id: productId } = useParams();
  const navigate = useNavigate();

  const userInfo = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch { return null; }
  }, []);

  // form state
  const [productLoaded, setProductLoaded] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');
  const [image, setImage] = useState('');
  const [countInStock, setCountInStock] = useState('0');
  const [description, setDescription] = useState('');

  const [initial, setInitial] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ui state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [errorUpdate, setErrorUpdate] = useState('');
  const [successUpdate, setSuccessUpdate] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const dropRef = useRef(null);

  // media linking state
  const [mediaList, setMediaList] = useState([]);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaPages, setMediaPages] = useState(1);
  const [mediaQuery, setMediaQuery] = useState('');
  const [heroMediaId, setHeroMediaId] = useState(null);
  const [links, setLinks] = useState([]);
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    setMeta({ title: `Edit Product – ${productId} – Admin – Vyshnavi Pelimelli`, description: 'Admin: edit product.' });
  }, [productId]);

  useEffect(() => {
    if (!userInfo || !(userInfo.isAdmin || userInfo.is_staff)) { navigate('/login'); }
  }, [navigate, userInfo]);

  // fetch product
  useEffect(() => {
    let mounted = true;
    async function fetchProduct() {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(`/api/products/${productId}/`, { headers: userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : undefined });
        if (!mounted) return;
        setName(data.name ?? '');
        setPrice(String(data.price ?? 0));
        setImage(data.image ?? '');
        setCountInStock(String(data.countInStock ?? 0));
        setDescription(data.description ?? '');
        setInitial({ name: data.name ?? '', price: String(data.price ?? 0), image: data.image ?? '', countInStock: String(data.countInStock ?? 0), description: data.description ?? '', createdAt: data.createdAt || data.created_at || null, updatedAt: data.updatedAt || data.updated_at || null });
        setProductLoaded(true);
        setError('');
      } catch (err) {
        setError(err?.response?.data?.detail || 'Error loading product');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (!productLoaded) fetchProduct();
    return () => { mounted = false; };
  }, [productId, productLoaded, userInfo]);

  // load media library (paginated)
  useEffect(() => {
    let cancel = false;
    async function loadMedia() {
      try {
        const params = new URLSearchParams({ sort_by: 'createdAt', order: 'desc', page: String(mediaPage), page_size: '12' });
        const { data } = await axiosInstance.get(`/api/products/media/?${params.toString()}`);
        const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
        const filtered = mediaQuery.trim() ? results.filter(m => `${m.alt||''}`.toLowerCase().includes(mediaQuery.trim().toLowerCase())) : results;
        if (!cancel) {
          setMediaList(filtered);
          setMediaPages(Number(data?.pages || 1));
        }
      } catch {}
    }
    loadMedia();
    return () => { cancel = true; };
  }, [mediaPage, mediaQuery]);

  // load product media links
  useEffect(() => {
    let cancel = false;
    async function loadLinks() {
      try {
        setLinkLoading(true);
        const { data } = await axiosInstance.get(`/api/products/${productId}/media-links/`);
        if (!cancel) setLinks(Array.isArray(data) ? data : []);
      } finally { if (!cancel) setLinkLoading(false); }
    }
    loadLinks();
    return () => { cancel = true; };
  }, [productId]);

  const dirty = useMemo(() => {
    if (!initial) return false;
    return (
      name !== initial.name || String(price) !== String(initial.price) || image !== initial.image || String(countInStock) !== String(initial.countInStock) || description !== initial.description
    );
  }, [name, price, image, countInStock, description, initial]);

  useEffect(() => {
    const handler = (e) => { if (!dirty) return; e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); onSubmit(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [name, price, image, countInStock, description]);

  const validate = useCallback(() => {
    const errs = {};
    const p = Number(price);
    const stock = Number(countInStock);
    if (!String(name).trim()) errs.name = 'Name is required';
    else if (name.trim().length < 3) errs.name = 'Name should be at least 3 characters';
    if (!Number.isFinite(p)) errs.price = 'Enter a valid price';
    else if (p < 0) errs.price = 'Price cannot be negative';
    if (!Number.isInteger(stock)) errs.countInStock = 'Stock must be an integer';
    else if (stock < 0) errs.countInStock = 'Stock cannot be negative';
    if (!String(image).trim()) errs.image = 'Image is required (URL or upload)';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [name, price, countInStock, image]);

  const doUpdate = async (goBack = false) => {
    setLoadingUpdate(true); setErrorUpdate(''); setSuccessUpdate(false);
    try {
      await axiosInstance.put(`/api/products/update/${productId}/`, { _id: productId, name: String(name).trim(), price: Number(price), image: String(image).trim(), countInStock: Number(countInStock), description: String(description || '').trim() }, { headers: userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : undefined });
      setSuccessUpdate(true);
      setInitial((prev) => prev ? { ...prev, name, price: String(price), image, countInStock: String(countInStock), description } : null);
      if (goBack) navigate('/admin/productlist');
    } catch (err) { setErrorUpdate(err?.response?.data?.detail || 'Error updating product'); }
    finally { setLoadingUpdate(false); }
  };

  const onSubmit = async (e) => { e?.preventDefault?.(); if (!validate()) return; await doUpdate(false); };
  const onSubmitAndBack = async () => { if (!validate()) return; await doUpdate(true); };

  const duplicate = async () => {
    if (!initial) return; if (!window.confirm('Duplicate this product?')) return;
    try {
      setDuplicating(true);
      const payload = { name: `${name} (Copy)`, price: Number(price), image: image, countInStock: Number(countInStock), description: description };
      const { data } = await axiosInstance.post('/api/products/create/', payload, { headers: userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : undefined });
      const newId = data?._id || data?.id; if (newId) navigate(`/admin/product/${newId}/edit`);
    } catch (err) { setErrorUpdate(err?.response?.data?.detail || 'Error duplicating product'); }
    finally { setDuplicating(false); }
  };

  const remove = async () => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      setDeleting(true);
      await axiosInstance.delete(`/api/products/delete/${productId}/`, { headers: userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : undefined });
      navigate('/admin/productlist');
    } catch (err) { setErrorUpdate(err?.response?.data?.detail || 'Error deleting product'); }
    finally { setDeleting(false); }
  };

  const uploadFileHandler = async (e) => {
    const file = e.target?.files?.[0]; if (!file) return;
    if (!/^image\//.test(file.type)) { setFieldErrors((fe) => ({ ...fe, image: 'Please select an image file' })); return; }
    if (file.size > 6 * 1024 * 1024) { setFieldErrors((fe) => ({ ...fe, image: 'Max file size is 6MB' })); return; }
    const formData = new FormData(); formData.append('image', file); formData.append('product_id', productId);
    setUploading(true); setFieldErrors((fe) => ({ ...fe, image: '' }));
    try {
      const { data } = await axiosInstance.post('/api/products/upload/', formData, { headers: { ...(userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : {}), 'Content-Type': 'multipart/form-data' } });
      setImage(data?.image || image);
    } catch (err) { setError(err?.response?.data?.detail || 'Error uploading image'); }
    finally { setUploading(false); if (e.target) e.target.value = null; }
  };

  // hero picker: choose from media library
  const addLink = async (mediaId) => {
    try {
      setLinkLoading(true);
      const { data } = await axiosInstance.post(`/api/products/${productId}/media-links/create/`, { media_id: mediaId, role: 'gallery', position: (links.length || 0) + 1 });
      setLinks([data, ...links]);
    } finally { setLinkLoading(false); }
  };

  const removeLink = async (linkId) => {
    if (!window.confirm('Remove this media from gallery?')) return;
    try {
      setLinkLoading(true);
      await axiosInstance.delete(`/api/products/media-links/${linkId}/delete/`);
      setLinks((prev) => prev.filter(l => l.id !== linkId));
    } finally { setLinkLoading(false); }
  };

  const onBack = (e) => { if (!dirty) return; const ok = window.confirm('You have unsaved changes. Leave without saving?'); if (!ok) { e.preventDefault(); } };

  if (loading) return <Loader />;
  if (error) return (
    <Container>
      <Link to='/admin/productlist' className='btn btn-light my-3' onClick={onBack}>Go Back</Link>
      <Message variant='danger'>{error}</Message>
    </Container>
  );

  return (
    <Container>
      <div className="d-flex align-items-center justify-content-between my-3" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bs-body-bg)' }}>
        <div className="d-flex align-items-center gap-2">
          <Link to='/admin/productlist' className='btn btn-light' onClick={onBack}>Back</Link>
          {initial?.updatedAt && (<span className="text-muted small">Updated {new Date(initial.updatedAt).toLocaleString()}</span>)}
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => { if (!initial) return; setName(initial.name); setPrice(initial.price); setImage(initial.image); setCountInStock(initial.countInStock); setDescription(initial.description); }} disabled={!dirty}>Revert</Button>
          <Button variant="outline-danger" onClick={remove} disabled={deleting}>{deleting ? <Spinner size="sm" /> : 'Delete'}</Button>
          <Button variant="outline-dark" onClick={duplicate} disabled={duplicating}>{duplicating ? <Spinner size="sm" /> : 'Duplicate'}</Button>
          <Button variant="dark" onClick={onSubmit} disabled={loadingUpdate}>{loadingUpdate ? <Spinner size="sm" /> : 'Save'}</Button>
          <Button variant="primary" onClick={onSubmitAndBack} disabled={loadingUpdate}>{loadingUpdate ? <Spinner size="sm" /> : 'Save & Back'}</Button>
        </div>
      </div>

      <Row className="justify-content-md-center">
        <Col xs={12} md={8} lg={7}>
          <h1 className="mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Edit Product</h1>
          {successUpdate && <Alert variant='success' onClose={() => setSuccessUpdate(false)} dismissible>Product updated successfully</Alert>}
          {errorUpdate && <Message variant='danger'>{errorUpdate}</Message>}

          <Form onSubmit={onSubmit} noValidate>
            <Card className="mb-3">
              <Card.Body>
                <Form.Group controlId='name' className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type='text' placeholder='Enter name' value={name} onChange={(e) => { setName(e.target.value); setFieldErrors(fe => ({ ...fe, name: '' })); }} isInvalid={!!fieldErrors.name} required />
                  <Form.Control.Feedback type="invalid">{fieldErrors.name}</Form.Control.Feedback>
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group controlId='price' className="mb-3">
                      <Form.Label>Price</Form.Label>
                      <Form.Control type='number' min="0" step="0.01" placeholder='Enter price' value={price} onChange={(e) => { setPrice(e.target.value); setFieldErrors(fe => ({ ...fe, price: '' })); }} isInvalid={!!fieldErrors.price} required />
                      <Form.Control.Feedback type="invalid">{fieldErrors.price}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId='countinstock' className="mb-3">
                      <Form.Label>Stock</Form.Label>
                      <Form.Control type='number' min="0" step="1" placeholder='Enter stock' value={countInStock} onChange={(e) => { setCountInStock(e.target.value); setFieldErrors(fe => ({ ...fe, countInStock: '' })); }} isInvalid={!!fieldErrors.countInStock} required />
                      <Form.Control.Feedback type="invalid">{fieldErrors.countInStock}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group controlId='description' className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as='textarea' rows={4} placeholder='Enter description' value={description} onChange={(e) => setDescription(e.target.value)} />
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Body>
                <Form.Group controlId='image' className="mb-2">
                  <Form.Label>Image URL</Form.Label>
                  <Form.Control type='text' placeholder='https://…' value={image} onChange={(e) => { setImage(e.target.value); setFieldErrors(fe => ({ ...fe, image: '' })); }} isInvalid={!!fieldErrors.image} aria-describedby="image-help" />
                  <Form.Text id="image-help" muted>Paste a URL or upload a file below.</Form.Text>
                  <Form.Control.Feedback type="invalid">{fieldErrors.image}</Form.Control.Feedback>
                </Form.Group>
                <div ref={dropRef} className="p-3 border rounded d-flex align-items-center justify-content-between gap-3" style={{ background: '#fafafa' }}>
                  <div>
                    <div className="fw-semibold">Upload image</div>
                    <div className="text-muted small">PNG/JPEG/WebP, up to 6MB. Drag & drop supported.</div>
                    <Form.Control className="mt-2" type='file' accept="image/*" onChange={uploadFileHandler} disabled={uploading} />
                    {uploading && <div className='mt-2'><Spinner animation="border" size="sm" /> Uploading…</div>}
                  </div>
                  <div style={{ width: 140, height: 140, borderRadius: 8, overflow: 'hidden', background: '#eee', flex: '0 0 auto' }}>
                    {image ? (<img src={image} alt="Product image preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : (<div className="d-flex w-100 h-100 align-items-center justify-content-center text-muted small">No image</div>)}
                  </div>
                </div>
                {initial?.createdAt && (<div className="text-muted small mt-2">Created {new Date(initial.createdAt).toLocaleString()}</div>)}
              </Card.Body>
            </Card>
          </Form>
        </Col>

        <Col xs={12} md={4} lg={5}>
          <Card className="mb-3">
            <Card.Header className="d-flex align-items-center justify-content-between"><span>Media library</span>
              <InputGroup size="sm" style={{width:220}}>
                <Form.Control placeholder="Search media..." value={mediaQuery} onChange={(e)=>setMediaQuery(e.target.value)} />
              </InputGroup>
            </Card.Header>
            <Card.Body>
              <div className="row g-2">
                {mediaList.map(m => (
                  <div className="col-6 col-md-4" key={m.id}>
                    <div className="border rounded position-relative" style={{cursor:'pointer'}} onClick={()=>addLink(m.id)}>
                      <Image src={m.file_url} alt={m.alt||''} className="w-100" style={{height:100, objectFit:'cover'}} />
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>Gallery links</Card.Header>
            <Card.Body>
              {linkLoading ? <Loader /> : links.length === 0 ? (
                <Message variant="info">No media linked yet. Click a media item to add.</Message>
              ) : (
                <Table size='sm' responsive className="align-middle">
                  <thead><tr><th style={{width:60}}>Preview</th><th>Alt</th><th style={{width:80}}>Role</th><th style={{width:80}}></th></tr></thead>
                  <tbody>
                    {links.map(l => (
                      <tr key={l.id}>
                        <td><Image src={l.media?.file_url} alt={l.media?.alt||''} style={{width:56,height:56,objectFit:'cover'}} className="border" /></td>
                        <td className="text-truncate" title={l.media?.alt}>{l.media?.alt || '-'}</td>
                        <td><Badge bg={l.role==='detail'?'primary':'secondary'}>{l.role}</Badge></td>
                        <td className="text-end"><Button size='sm' variant='outline-danger' onClick={()=>removeLink(l.id)}>Remove</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ProductEditScreen;
