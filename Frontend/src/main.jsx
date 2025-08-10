import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import { CartProvider } from './state/cartStore.jsx';

function AccessibilityShell({ children }) {
  useEffect(() => {
    // Skip link target
    let target = document.getElementById('main-content');
    if (!target) {
      target = document.createElement('div');
      target.id = 'main-content';
      target.tabIndex = -1;
      document.body.prepend(target);
    }
    // Focus on hash change/route change for SPA
    const onHash = () => {
      const el = document.getElementById('main-content');
      el && el.focus();
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return children;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CartProvider>
      <a href="#main-content" className="visually-hidden-focusable" aria-label="Skip to main content">Skip to content</a>
      <AccessibilityShell>
        <App />
      </AccessibilityShell>
    </CartProvider>
  </StrictMode>
);
