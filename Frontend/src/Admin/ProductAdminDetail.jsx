import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Form, Button, Alert, Table } from 'react-bootstrap';
import axios from '../axiosInstance';

export default function ProductAdminDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = React.useState(null);
  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [stock, setStock] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  function normalizeId(v) { return String(v || '').replace(/[^0-9]/g, ''); }

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true); setError('');
        const { data } = await axios.get(`/api/products/${normalizeId(id)}/`);
        if (!mounted) return;
        setProduct(data);
        setName(data?.name || '');
        setPrice(data?.price ?? 0);
        setStock(data?.countInStock ?? 0);
        setDescription(data?.description || '');
      } catch (e) {
        if (!mounted) return; setError(e?.response?.data?.detail || e?.message || 'Failed to load product');
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [id]);

  async function save(e) {
    e.preventDefault();
    try {
      await axios.put(`/api/products/update/${normalizeId(id)}/`, { name, price: Number(price), countInStock: Number(stock), description });
      navigate('/admin/products');
    } catch (e) { setError(e?.response?.data?.detail || 'Failed to save'); }
  }

  if (loading) return <div className="p-3">Loading…</div>;
  if (error) return <Alert variant="danger" className="m-3">{error}</Alert>;
  if (!product) return <Alert variant="warning" className="m-3">Product not found</Alert>;

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const media = Array.isArray(product.media) ? product.media : (product.image ? [{ url: product.image, role: 'hero', position: 0 }] : []);

  return (
    <div>
      <h1 style={{ fontFamily:'Playfair Display, serif' }}>Product</h1>
      <Row className="g-3">
        <Col md={5}>
          <Card className="shadow-sm">
            <Card.Header>Details</Card.Header>
            <Card.Body>
              <Form onSubmit={save}>
                <Form.Group className="mb-2"><Form.Label>Name</Form.Label><Form.Control value={name} onChange={(e)=>setName(e.target.value)} /></Form.Group>
                <Row className="g-2">
                  <Col><Form.Group className="mb-2"><Form.Label>Price</Form.Label><Form.Control type="number" step="0.01" value={price} onChange={(e)=>setPrice(e.target.value)} /></Form.Group></Col>
                  <Col><Form.Group className="mb-2"><Form.Label>Stock</Form.Label><Form.Control type="number" value={stock} onChange={(e)=>setStock(e.target.value)} /></Form.Group></Col>
                </Row>
                <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={5} value={description} onChange={(e)=>setDescription(e.target.value)} /></Form.Group>
                <div className="d-flex justify-content-between"><Button variant="outline-dark" onClick={()=>navigate(-1)}>Back</Button><Button type="submit" variant="dark">Save</Button></div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col md={7}>
          <Card className="shadow-sm mb-3">
            <Card.Header>Media</Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead><tr><th style={{width:90}}>Preview</th><th>Alt</th><th>Role</th></tr></thead>
                <tbody>
                  {media.map(m => (
                    <tr key={m.id || m.url}>
                      <td>{m.url ? <img src={m.url} alt={m.alt || ''} style={{ width:64, height:64, objectFit:'cover', borderRadius:6 }} /> : '-'}</td>
                      <td>{m.alt || '-'}</td>
                      <td>{m.role || 'gallery'}</td>
                    </tr>
                  ))}
                  {media.length === 0 && <tr><td colSpan={3} className="text-center text-muted py-3">No media</td></tr>}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header>Variants</Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead><tr><th>SKU</th><th>Size</th><th>Color</th><th>Price</th><th>Stock</th></tr></thead>
                <tbody>
                  {variants.map(v => (
                    <tr key={v.id || v.sku}><td>{v.sku || '-'}</td><td>{v.size || '-'}</td><td>{v.color || '-'}</td><td>{(v.price_cents ? (v.price_cents/100).toFixed(2) : '-') }</td><td>{v.stock ?? '-'}</td></tr>
                  ))}
                  {variants.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-3">No variants</td></tr>}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}


