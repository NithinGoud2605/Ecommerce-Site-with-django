import React, { useMemo } from 'react';

/**
 * AddToCartButton
 * - Validates a variant is chosen
 * - Calls provided onAdd({ variantId, quantity })
 */

export default function AddToCartButton({ selectedVariantId, quantity = 1, disabled, loading = false, onAdd }) {
  const isDisabled = useMemo(() => {
    if (disabled) return true;
    return !selectedVariantId;
  }, [disabled, selectedVariantId]);

  return (
    <button
      type="button"
      className="btn btn-primary w-100"
      disabled={isDisabled || loading}
      onClick={() => onAdd?.({ variantId: selectedVariantId, quantity })}
    >
      {loading ? 'Adding…' : 'Add to Cart'}
    </button>
  );
}


