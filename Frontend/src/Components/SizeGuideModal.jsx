import React, { useEffect, useRef } from 'react';

/**
 * SizeGuideModal
 * - Simple modal with focus trap and ESC to close
 */

export default function SizeGuideModal({ open, onClose, imageUrl = null }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    const el = dialogRef.current;
    el?.focus();

    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab') {
        const focusable = el.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1050 }}
      role="dialog"
      aria-modal="true"
      aria-label="Size guide"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded shadow"
        style={{ width: 'min(90vw, 720px)' }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="m-0">Size Guide</h5>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {imageUrl ? (
          <img src={imageUrl} alt="Size guide" className="img-fluid" />
        ) : (
          <>
            <p className="mb-2">Use your measurements to find your best fit.</p>
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th scope="col">Size</th>
                    <th scope="col">Bust (in)</th>
                    <th scope="col">Waist (in)</th>
                    <th scope="col">Hips (in)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><th scope="row">XS</th><td>31–32</td><td>24–25</td><td>34–35</td></tr>
                  <tr><th scope="row">S</th><td>33–34</td><td>26–27</td><td>36–37</td></tr>
                  <tr><th scope="row">M</th><td>35–36</td><td>28–29</td><td>38–39</td></tr>
                  <tr><th scope="row">L</th><td>37–39</td><td>30–32</td><td>40–42</td></tr>
                  <tr><th scope="row">XL</th><td>40–42</td><td>33–35</td><td>43–45</td></tr>
                </tbody>
              </table>
            </div>
            <p className="small text-muted mb-0">Tip: Bust at fullest point; waist at narrowest; hips at fullest.</p>
          </>
        )}
      </div>
    </div>
  );
}


