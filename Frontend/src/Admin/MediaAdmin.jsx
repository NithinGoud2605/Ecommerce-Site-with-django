import React, { useEffect, useState } from 'react';
import { Button, Form, Image, Table, Modal } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import Message from '../Components/Message';
import Loader from '../Components/Loader';
import { useOutletContext } from 'react-router-dom';

export default function MediaAdmin() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [alt, setAlt] = useState('');
  const [role, setRole] = useState('gallery');
  const [productFolder, setProductFolder] = useState('');
  const { notify } = useOutletContext() || { notify: () => {} };
  const [linkModal, setLinkModal] = useState({ open: false, target: null, type: 'product' });
  const [targetId, setTargetId] = useState('');

  async function load() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_media')
        .select('id, path, alt, role, position')
        .order('position', { ascending: true });
      if (error) throw error;
      setItems(data || []);
      setLoading(false);
    } catch (e) {
      setError(e?.message || 'Failed to load media');
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function upload() {
    if (!file) return;
    if (!alt.trim()) { setError('Alt text is required'); return; }
    const prefix = productFolder ? `${productFolder.replace(/\/+$/,'')}/` : '';
    const path = `${prefix}${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (upErr) { setError(upErr.message); return; }
    const { error } = await supabase.from('product_media').insert({ path, alt, role, position: (items?.length || 0) + 1 });
    if (error) { setError(error.message); return; }
    setFile(null); setAlt('');
    await load();
    notify('Uploaded');
  }

  async function updateItem(id, patch) {
    const { error } = await supabase.from('product_media').update(patch).eq('id', id);
    if (error) setError(error.message);
  }

  function onReorder(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[i], b = items[j];
    const next = items.slice();
    next[i] = { ...a, position: b.position };
    next[j] = { ...b, position: a.position };
    setItems(next);
    updateItem(a.id, { position: next[i].position });
    updateItem(b.id, { position: next[j].position });
  }

  if (loading) return <Loader />;
  if (error) return <Message variant='danger'>{error}</Message>;

  return (
    <div>
      <div className='d-flex gap-2 mb-3'>
        <Form.Control type='file' onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ maxWidth: 300 }} />
        <Form.Control placeholder='Alt text' value={alt} onChange={(e) => setAlt(e.target.value)} style={{ maxWidth: 300 }} />
        <Form.Select value={role} onChange={(e)=>setRole(e.target.value)} style={{ maxWidth: 160 }}>
          <option value='gallery'>Gallery</option>
          <option value='hero'>Hero</option>
        </Form.Select>
        <Form.Control placeholder='Product folder (optional)' value={productFolder} onChange={(e)=>setProductFolder(e.target.value)} style={{ maxWidth: 240 }} />
        <Button onClick={upload} disabled={!file}>Upload</Button>
      </div>
      <Table striped>
        <thead>
          <tr>
            <th>Preview</th><th>Path</th><th>Alt</th><th>Role</th><th>Pos</th><th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((m, i) => (
            <tr key={m.id}>
              <td><Image src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${m.path}`} alt={m.alt || ''} style={{ width: 60, height: 60, objectFit: 'cover' }} /></td>
              <td>{m.path}</td>
              <td><Form.Control value={m.alt || ''} onChange={(e) => { const v = e.target.value; setItems((prev) => prev.map((x, idx) => idx === i ? { ...x, alt: v } : x)); }} onBlur={() => updateItem(m.id, { alt: items[i].alt })} /></td>
              <td>
                <Form.Select value={m.role || 'gallery'} onChange={async (e) => { const val = e.target.value; setItems((prev)=>prev.map((x,idx)=>idx===i?{...x, role:val}:x)); await updateItem(m.id, { role: val }); }}>
                  <option value='gallery'>Gallery</option>
                  <option value='hero'>Hero</option>
                </Form.Select>
              </td>
              <td>{m.position}</td>
              <td className='d-flex gap-1'>
                <Button size='sm' variant='light' onClick={() => onReorder(i, -1)} disabled={i===0}>↑</Button>
                <Button size='sm' variant='light' onClick={() => onReorder(i, +1)} disabled={i===items.length-1}>↓</Button>
                <Button size='sm' onClick={()=>{ setLinkModal({ open:true, target: m, type:'product' }); }}>Attach to Product</Button>
                <Button size='sm' variant='secondary' onClick={()=>{ setLinkModal({ open:true, target: m, type:'collection' }); }}>Attach to Collection</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={linkModal.open} onHide={()=>setLinkModal({ open:false, target:null, type:'product' })} centered>
        <Modal.Header closeButton><Modal.Title>Attach media</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className='mb-3'>
            <Form.Label>{linkModal.type === 'product' ? 'Product ID' : 'Collection ID'}</Form.Label>
            <Form.Control placeholder={linkModal.type === 'product' ? 'prod_xxx' : 'col_xxx'} value={targetId} onChange={(e)=>setTargetId(e.target.value)} />
          </Form.Group>
          <div className='text-muted small'>Picker by folder/role coming soon.</div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={()=>setLinkModal({ open:false, target:null, type:'product' })}>Cancel</Button>
          <Button onClick={async ()=>{
            if (!linkModal.target || !targetId) return;
            if (linkModal.type === 'product') {
              await supabase.from('product_media_links').insert({ product_id: targetId, media_id: linkModal.target.id });
            } else {
              await supabase.from('collection_media_links').insert({ collection_id: targetId, media_id: linkModal.target.id });
            }
            setLinkModal({ open:false, target:null, type:'product' });
            setTargetId('');
            notify('Attached');
          }}>Attach</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}


