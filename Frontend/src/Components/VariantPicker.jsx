import React, { useEffect, useMemo, useState } from 'react';

/**
 * VariantPicker
 * - Renders size and color selectors derived from variants
 * - Disables options with zero stock
 * - Calls onChange({ variantId, size, color }) whenever a valid selection changes
 */

export default function VariantPicker({ variants, onChange }) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  const sizeOptions = useMemo(() => {
    const set = new Map();
    (variants || []).forEach((v) => {
      const key = v?.size ?? '';
      if (!set.has(key)) set.set(key, 0);
      set.set(key, (set.get(key) || 0) + (typeof v?.stock === 'number' ? v.stock : 0));
    });
    return Array.from(set.entries()).map(([size, totalStock]) => ({ size, totalStock }));
  }, [variants]);

  const colorOptions = useMemo(() => {
    const set = new Map();
    (variants || []).forEach((v) => {
      const key = v?.color ?? '';
      if (!set.has(key)) set.set(key, 0);
      set.set(key, (set.get(key) || 0) + (typeof v?.stock === 'number' ? v.stock : 0));
    });
    return Array.from(set.entries()).map(([color, totalStock]) => ({ color, totalStock }));
  }, [variants]);

  const selectedVariant = useMemo(() => {
    if (!selectedSize || !selectedColor) return null;
    return (variants || []).find((v) => v?.size === selectedSize && v?.color === selectedColor) || null;
  }, [variants, selectedSize, selectedColor]);

  useEffect(() => {
    if (!onChange) return;
    const variantId = selectedVariant?.id || null;
    onChange({ variantId, size: selectedSize, color: selectedColor });
  }, [selectedVariant, selectedSize, selectedColor, onChange]);

  return (
    <div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Size</label>
        <div className="d-flex flex-wrap gap-2">
          {sizeOptions.map(({ size, totalStock }) => {
            const disabled = (totalStock || 0) <= 0;
            const active = selectedSize === size;
            return (
              <button
                key={String(size)}
                type="button"
                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-primary'}`}
                disabled={disabled}
                onClick={() => setSelectedSize(size)}
              >
                {size || 'One Size'}
                {!disabled && totalStock < 5 && <span className="badge bg-warning text-dark ms-2">Low</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">Color</label>
        <div className="d-flex flex-wrap gap-2">
          {colorOptions.map(({ color, totalStock }) => {
            const disabled = (totalStock || 0) <= 0;
            const active = selectedColor === color;
            return (
              <button
                key={String(color)}
                type="button"
                className={`border ${active ? '' : ''}`}
                style={{ width: 28, height: 28, borderRadius: 999, background: color || '#ccc', outlineOffset: 2, opacity: disabled ? 0.4 : 1 }}
                disabled={disabled}
                aria-label={`Color ${color || 'default'}`}
                onClick={() => setSelectedColor(color)}
              />
            );
          })}
        </div>
      </div>

      {selectedVariant && selectedVariant?.stock > 0 ? (
        <div className={`small ${selectedVariant.stock < 5 ? 'text-warning' : 'text-success'}`}>
          {selectedVariant.stock < 5 ? `Low stock: ${selectedVariant.stock} left` : `In stock: ${selectedVariant.stock}`}
        </div>
      ) : (
        <div className="text-danger small">Select size and color</div>
      )}
    </div>
  );
}


