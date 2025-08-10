import React, { useEffect, useState } from 'react';
import { Button, Form, Table, Modal } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { useOutletContext } from 'react-router-dom';

export default function ProductsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { notify } = useOutletContext() || { notify: () => {} };
  const [showAdd, setShowAdd] = useState(false);
  const [dupIndex, setDupIndex] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('id, slug, name, description, gender, active').order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
      setLoading(false);
    } catch (e) {
      setError(e?.message || 'Failed to load products');
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save(i) {
    const p = items[i];
    const { error } = await supabase.from('products').update({ name: p.name, description: p.description, gender: p.gender, active: !!p.active }).eq('id', p.id);
    if (error) throw error;
    notify('Product saved');
  }

  const onChange = (i, key, value) => setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));

  async function addNew() {
    const slug = `prod_${Date.now()}`;
    const { data, error } = await supabase.from('products').insert({ slug, name: 'Untitled', active: false }).select('id, slug, name, description, gender, active').single();
    if (error) { notify('Add failed'); return; }
    setItems([data, ...items]);
    notify('Product added');
  }

  async function duplicate(i) {
    const p = items[i];
    const slug = `${p.slug || 'prod'}_copy_${Date.now()}`;
    const { data, error } = await supabase.from('products').insert({ slug, name: `${p.name} (Copy)`, description: p.description, gender: p.gender, active: false }).select('id, slug, name, description, gender, active').single();
    if (error) { notify('Duplicate failed'); return; }
    setItems([data, ...items]);
    notify('Product duplicated');
  }

  if (loading) return <Loader />;
  if (error) return <Message variant='danger'>{error}</Message>;

  return (
    <>
    <div className='d-flex justify-content-end mb-2 gap-2'>
      <Button size='sm' onClick={addNew}>Add</Button>
    </div>
    <Table striped>
      <thead>
        <tr><th>Slug</th><th>Name</th><th>Gender</th><th>Active</th><th>Description</th><th></th></tr>
      </thead>
      <tbody>
        {items.map((p, i) => (
          <tr key={p.id}>
            <td>{p.slug}</td>
            <td><Form.Control value={p.name || ''} onChange={(e) => onChange(i, 'name', e.target.value)} /></td>
            <td>
              <Form.Select value={p.gender || ''} onChange={(e) => onChange(i, 'gender', e.target.value)}>
                <option value=''>-</option>
                <option value='women'>Women</option>
                <option value='men'>Men</option>
                <option value='unisex'>Unisex</option>
              </Form.Select>
            </td>
            <td><Form.Check checked={!!p.active} onChange={(e) => onChange(i, 'active', e.target.checked)} /></td>
            <td><Form.Control as='textarea' rows={2} value={p.description || ''} onChange={(e) => onChange(i, 'description', e.target.value)} /></td>
            <td className='d-flex gap-1'>
              <Button size='sm' onClick={() => save(i)}>Save</Button>
              <Button size='sm' variant='secondary' onClick={() => duplicate(i)}>Duplicate</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
    </>
  );
}


