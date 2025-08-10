import React, { useMemo, useState } from 'react';
import { Container, Nav, Toast, ToastContainer } from 'react-bootstrap';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const { pathname } = useLocation();
  const tabs = [
    { to: '/admin/products', label: 'Products' },
    { to: '/admin/variants', label: 'Variants' },
    { to: '/admin/media', label: 'Media' },
    { to: '/admin/collections', label: 'Collections' },
    { to: '/admin/pages', label: 'Pages' },
  ];
  const section = useMemo(() => tabs.find((t) => pathname.startsWith(t.to))?.label || 'Dashboard', [pathname]);
  const [toast, setToast] = useState({ show: false, message: '' });
  const notify = (message) => setToast({ show: true, message });
  const [actions, setActions] = useState(null);

  return (
    <Container className='py-3'>
      <div className='d-flex align-items-center justify-content-between mb-3'>
        <div>
          <div className='text-muted small'>Admin</div>
          <h2 className='m-0'>{section}</h2>
        </div>
        <div>{actions}</div>
      </div>
      <div className='d-flex'>
        <div className='me-4' style={{ minWidth: 200 }}>
          <Nav className='flex-column nav-pills'>
            {tabs.map((t) => (
              <Nav.Link key={t.to} as={Link} to={t.to} active={pathname.startsWith(t.to)}>{t.label}</Nav.Link>
            ))}
          </Nav>
        </div>
        <div className='flex-grow-1'>
          <Outlet context={{ notify, setActions }} />
        </div>
      </div>
      <ToastContainer position='bottom-center' className='p-3'>
        <Toast bg='success' onClose={() => setToast((t)=>({ ...t, show:false }))} show={toast.show} delay={2000} autohide>
          <Toast.Body className='text-white'>{toast.message || 'Saved'}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}


