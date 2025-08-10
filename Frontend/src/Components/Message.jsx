import React from 'react';

export default function Message({ variant = 'info', children, onRetry }) {
  const colors = {
    success: { bg: '#e7f6ed', fg: '#0f5132', border: '#badbcc' },
    info: { bg: '#eef5ff', fg: '#084298', border: '#b6d4fe' },
    warning: { bg: '#fff4e5', fg: '#664d03', border: '#ffe69c' },
    danger: { bg: '#fdecea', fg: '#842029', border: '#f5c2c7' },
  };
  const theme = colors[variant] || colors.info;
  return (
    <div role="status" className="d-flex align-items-start gap-2 p-2 rounded" style={{ background: theme.bg, color: theme.fg, border: `1px solid ${theme.border}` }}>
      <div className="flex-grow-1">{children}</div>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onRetry} aria-label="Retry">Retry</button>
      )}
    </div>
  );
}
