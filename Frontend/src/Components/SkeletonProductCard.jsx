import React from 'react';

export default function SkeletonProductCard() {
  const shimmer = {
    background: 'linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%)',
    backgroundSize: '400% 100%',
    animation: 'shimmer 1.2s infinite',
  };
  return (
    <div className="my-3 p-3" style={{ borderRadius: 16, background: '#f8f8f8' }} aria-hidden="true">
      <div style={{ position: 'relative', width: '100%', paddingTop: '125%', borderRadius: 12, ...shimmer }} />
      <div className="mt-3" style={{ height: 16, width: '70%', borderRadius: 6, ...shimmer }} />
      <div className="mt-2" style={{ height: 14, width: '40%', borderRadius: 6, ...shimmer }} />
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  );
}


