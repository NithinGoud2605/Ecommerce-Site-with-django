import React, { useEffect, useState } from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { useOutletContext } from 'react-router-dom';

export default function CollectionsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { notify } = useOutletContext() || { notify: () => {} };
  const [activeId, setActiveId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('collections').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
      setLoading(false);
    } catch (e) {
      setError(e?.message || 'Failed to load collections');
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function loadEntries(collectionId) {
    if (!collectionId) return;
    try {
      setLoadingEntries(true);
      const { data, error } = await supabase
        .from('collection_entries')
        .select('id, path, caption, position')
        .eq('collection_id', collectionId)
        .order('position', { ascending: true });
      if (error) throw error;
      setEntries(data || []);
    } catch (e) {
      setError(e?.message || 'Failed to load entries');
    } finally {
      setLoadingEntries(false);
    }
  }

  async function save(i) {
    const c = items[i];
    const { error } = await supabase.from('collections').update({
      title: c.title,
      season: c.season,
      summary: c.summary,
      hero_media: c.hero_media || null,
      published_at: c.published_at || null,
    }).eq('id', c.id);
    if (error) throw error;
    notify('Collection saved');
  }

  const onChange = (i, key, value) => setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));

  // Drag and drop reorder for entries
  const [dragIndex, setDragIndex] = useState(null);
  function onEntryDragStart(i) { setDragIndex(i); }
  function onEntryDragOver(e, i) { e.preventDefault(); if (dragIndex === null || dragIndex === i) return; setEntries((arr)=>{ const next = arr.slice(); const [m] = next.splice(dragIndex,1); next.splice(i,0,m); setDragIndex(i); return next; }); }
  async function onEntryDragEnd() {
    // Persist new positions (1-based)
    const updates = entries.map((en, idx) => ({ id: en.id, position: idx + 1 }));
    for (const u of updates) {
      await supabase.from('collection_entries').update({ position: u.position }).eq('id', u.id);
    }
    notify('Entries reordered');
    setDragIndex(null);
  }

  if (loading) return <Loader />;
  if (error) return <Message variant='danger'>{error}</Message>;

  return (
    <div className='d-flex gap-4'>
      <div className='flex-grow-1'>
        <Table striped>
          <thead>
            <tr><th>Slug</th><th>Title</th><th>Season</th><th>Summary</th><th>Publish</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((c, i) => (
              <tr key={c.id} onClick={() => { setActiveId(c.id); loadEntries(c.id); }} style={{ cursor:'pointer', background: activeId===c.id ? '#f8f9fa' : undefined }}>
                <td>{c.slug}</td>
                <td><Form.Control value={c.title || ''} onChange={(e) => onChange(i, 'title', e.target.value)} /></td>
                <td><Form.Control value={c.season || ''} onChange={(e) => onChange(i, 'season', e.target.value)} /></td>
                <td><Form.Control as='textarea' rows={2} value={c.summary || ''} onChange={(e) => onChange(i, 'summary', e.target.value)} /></td>
                <td><Form.Control type='datetime-local' value={c.published_at ? new Date(c.published_at).toISOString().slice(0,16) : ''} onChange={(e) => onChange(i, 'published_at', e.target.value ? new Date(e.target.value).toISOString() : null)} /></td>
                <td><Button size='sm' onClick={() => save(i)}>Save</Button></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <div style={{ minWidth: 360 }}>
        <h6>Entries {activeId ? '' : '(select a collection)'}</h6>
        {loadingEntries ? <Loader /> : (
          <Table size='sm' hover>
            <thead><tr><th>#</th><th>Path</th><th>Caption</th></tr></thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id} draggable onDragStart={()=>onEntryDragStart(i)} onDragOver={(ev)=>onEntryDragOver(ev,i)} onDragEnd={onEntryDragEnd}>
                  <td>{i+1}</td>
                  <td>{e.path}</td>
                  <td>{e.caption}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}


