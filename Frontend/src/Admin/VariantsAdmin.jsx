import React, { useEffect, useState } from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { useOutletContext } from 'react-router-dom';

export default function VariantsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { notify } = useOutletContext() || { notify: () => {} };

  async function load() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, product_id, sku, size, color, price_cents, currency, stock, position')
        .order('product_id', { ascending: true })
        .order('position', { ascending: true });
      if (error) throw error;
      setItems(data || []);
      setLoading(false);
    } catch (e) {
      setError(e?.message || 'Failed to load variants');
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save(i) {
    const v = items[i];
    const { error } = await supabase.from('product_variants').update({ sku: v.sku, size: v.size, color: v.color, price_cents: v.price_cents, currency: v.currency, stock: v.stock, position: v.position }).eq('id', v.id);
    if (error) throw error;
    notify('Variant saved');
  }

  const onChange = (i, key, value) => setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  // Reorder by product then position with simple buttons
  function onReorder(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[i], b = items[j];
    if (a.product_id !== b.product_id) return; // don't cross product boundary
    const next = items.slice();
    next[i] = { ...a, position: b.position };
    next[j] = { ...b, position: a.position };
    setItems(next);
  }

  if (loading) return <Loader />;
  if (error) return <Message variant='danger'>{error}</Message>;

  return (
    <Table striped>
      <thead>
        <tr><th>Product</th><th>SKU</th><th>Size</th><th>Color</th><th>Price (cents)</th><th>Currency</th><th>Stock</th><th>Pos</th><th></th></tr>
      </thead>
      <tbody>
        {items.map((v, i) => (
          <tr key={v.id}>
            <td>{v.product_id}</td>
            <td><Form.Control value={v.sku || ''} onChange={(e) => onChange(i, 'sku', e.target.value)} /></td>
            <td><Form.Control value={v.size || ''} onChange={(e) => onChange(i, 'size', e.target.value)} /></td>
            <td><Form.Control value={v.color || ''} onChange={(e) => onChange(i, 'color', e.target.value)} /></td>
            <td><Form.Control type='number' value={v.price_cents ?? 0} onChange={(e) => onChange(i, 'price_cents', Number(e.target.value))} /></td>
            <td><Form.Control value={v.currency || 'USD'} onChange={(e) => onChange(i, 'currency', e.target.value)} /></td>
            <td><Form.Control type='number' value={v.stock ?? 0} onChange={(e) => onChange(i, 'stock', Number(e.target.value))} /></td>
            <td><Form.Control type='number' value={v.position ?? 0} onChange={(e) => onChange(i, 'position', Number(e.target.value))} /></td>
            <td className='d-flex gap-1'>
              <Button size='sm' variant='light' onClick={()=>onReorder(i,-1)} disabled={i===0 || items[i-1]?.product_id!==v.product_id}>↑</Button>
              <Button size='sm' variant='light' onClick={()=>onReorder(i,1)} disabled={i===items.length-1 || items[i+1]?.product_id!==v.product_id}>↓</Button>
              <Button size='sm' onClick={() => save(i)}>Save</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}


