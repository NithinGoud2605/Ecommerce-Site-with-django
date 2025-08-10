import React, { useEffect, useRef } from 'react';

// Load More button with optional infinite scroll sentinel
export default function Paginate({ hasMore, onLoadMore, infinite = false }) {
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!infinite || !sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) onLoadMore?.();
      });
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [infinite, onLoadMore]);

  if (!hasMore) return null;
  return (
    <div className='text-center my-3'>
      {!infinite && (
        <button type='button' className='btn btn-outline-secondary' onClick={() => onLoadMore?.()}>Load more</button>
      )}
      {infinite && <div ref={sentinelRef} aria-hidden='true' />}
    </div>
  );
}