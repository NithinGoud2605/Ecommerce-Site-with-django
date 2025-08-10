import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';

export default function FilterBar({ genderOptions = [], showGender = false, value, onChange, sort = 'newest', onSort }) {
  const [local, setLocal] = useState(() => ({ ...value, sort }));
  useEffect(() => setLocal((l) => ({ ...l, ...value, sort })), [value, sort]);

  function update(partial) {
    const next = { ...local, ...partial };
    setLocal(next);
    onChange?.(next);
  }

  const sizes = ['XS','S','M','L','XL'];
  const colors = ['#111','#666','#C8A96A','#B56576','#2A9D8F','#264653'];

  const chips = useMemo(() => {
    const list = [];
    if (showGender && local.gender) list.push({ key: 'gender', label: local.gender });
    if (local.size) list.push({ key: 'size', label: local.size });
    if (local.color) list.push({ key: 'color', label: 'Color' });
    return list;
  }, [local, showGender]);

  return (
    <div className="d-flex flex-wrap align-items-center gap-2 py-2 border-bottom position-sticky top-0 bg-white" style={{ zIndex: 1010 }}>
      {showGender && (
        <Form.Select value={local.gender || ''} onChange={(e) => update({ gender: e.target.value })} style={{ maxWidth: 160 }} aria-label="Filter by gender">
          <option value="">Gender</option>
          {genderOptions.map((g) => (<option key={g} value={g}>{g[0].toUpperCase()+g.slice(1)}</option>))}
        </Form.Select>
      )}
      <Form.Select value={local.size || ''} onChange={(e) => update({ size: e.target.value })} style={{ maxWidth: 140 }} aria-label="Filter by size">
        <option value="">Size</option>
        {sizes.map((s) => (<option key={s} value={s}>{s}</option>))}
      </Form.Select>
      <div className="d-flex align-items-center" role="group" aria-label="Filter by color">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => update({ color: c })}
            aria-label={`Color ${c}`}
            className="border rounded-circle me-2"
            style={{ width: 24, height: 24, background: c, outlineOffset: 2 }}
          />
        ))}
      </div>
      <Form.Select value={sort} onChange={(e) => onSort?.(e.target.value)} style={{ maxWidth: 180 }} aria-label="Sort products">
        <option value="newest">Newest</option>
        <option value="name_asc">Name (A-Z)</option>
        <option value="name_desc">Name (Z-A)</option>
        <option value="price_asc">Price (Low to High)</option>
        <option value="price_desc">Price (High to Low)</option>
      </Form.Select>
      <div className="ms-auto d-flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span key={chip.key} className="badge bg-light text-dark border" role="button" tabIndex={0} onClick={() => update({ [chip.key]: '' })} onKeyDown={(e) => e.key==='Enter' && update({ [chip.key]: '' })}>{chip.label} ×</span>
        ))}
        {(chips.length>0) && (
          <Button size="sm" variant="outline-secondary" onClick={() => update({ gender: '', size: '', color: '' })}>Clear all</Button>
        )}
      </div>
    </div>
  );
}


