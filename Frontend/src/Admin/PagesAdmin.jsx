import React, { useEffect, useState } from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import Message from '../Components/Message';
import Loader from '../Components/Loader';
import { useOutletContext } from 'react-router-dom';

export default function PagesAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { notify } = useOutletContext() || { notify: () => {} };

  async function load() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('pages').select('*').order('slug');
      if (error) throw error;
      setItems(data || []);
      setLoading(false);
    } catch (e) {
      setError(e?.message || 'Failed to load pages');
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(page) {
    const { id, ...rest } = page;
    const { error } = await supabase.from('pages').upsert({ id, ...rest });
    if (error) throw error;
    notify('Page saved');
  }

  function onFieldChange(i, key, value) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  }

  async function handleSave(i) {
    try {
      await save(items[i]);
      await load();
    } catch (e) {
      setError(e?.message || 'Save failed');
    }
  }

  if (loading) return <Loader />;
  if (error) return <Message variant='danger'>{error}</Message>;

  return (
    <div>
      <Table striped>
        <thead>
           <tr>
             <th>Slug</th>
             <th>Title</th>
             <th>Hero Path</th>
             <th>Body (Markdown)</th>
             <th>Published</th>
             <th></th>
           </tr>
        </thead>
        <tbody>
          {items.map((p, i) => (
            <tr key={p.id}>
              <td>{p.slug}</td>
              <td><Form.Control value={p.title || ''} onChange={(e) => onFieldChange(i, 'title', e.target.value)} /></td>
              <td><Form.Control value={p.hero_path || ''} onChange={(e) => onFieldChange(i, 'hero_path', e.target.value)} /></td>
              <td><Form.Control as='textarea' rows={4} value={p.body_md || ''} onChange={(e) => onFieldChange(i, 'body_md', e.target.value)} /></td>
              <td>
                <Form.Check
                  type='switch'
                  id={`pub-${p.id}`}
                  label=''
                  checked={!!p.published_at || !!p.is_published}
                  onChange={(e) => {
                    if ('published_at' in p) {
                      onFieldChange(i, 'published_at', e.target.checked ? new Date().toISOString() : null);
                    } else {
                      onFieldChange(i, 'is_published', e.target.checked);
                    }
                  }}
                />
              </td>
              <td><Button size='sm' onClick={() => handleSave(i)}>Save</Button></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}


