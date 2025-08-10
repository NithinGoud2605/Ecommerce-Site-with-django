import React from 'react';

export default function MasonryGrid({ children, columns = 4, gap = 16 }) {
  const style = {
    columnCount: columns,
    columnGap: `${gap}px`,
  };
  return (
    <div style={style}>
      {React.Children.map(children, (child, i) => (
        <div style={{ breakInside: 'avoid', marginBottom: gap, opacity: 0, transform: 'translateY(12px)', animation: 'fadeInUp 420ms cubic-bezier(0.33,1,0.68,1) forwards', animationDelay: `${(i % columns) * 50}ms` }}>
          {child}
        </div>
      ))}
      <style>{`@keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}


