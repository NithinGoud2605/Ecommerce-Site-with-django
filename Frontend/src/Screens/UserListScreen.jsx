import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Table, Button, Form, Row, Col, InputGroup, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { setMeta } from '../lib/seo.js';

function UserListScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);

  // UI state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const navigate = useNavigate();
  const userInfo = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('userInfo')); } catch { return null; }
  }, []);

  // a11y: focus heading when content ready
  const h1Ref = useRef(null);

  useEffect(() => {
    setMeta({ title: 'Users – Admin – Vyshnavi Pelimelli', description: 'Admin: manage users.' });
    // robots noindex for admin
    let tag = document.querySelector('meta[name="robots"]');
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name', 'robots'); document.head.appendChild(tag); }
    tag.setAttribute('content', 'noindex,nofollow');
  }, []);

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login?redirect=/admin/userlist');
      return;
    }

    let mounted = true;
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axiosInstance.get('/api/users/', {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        if (!mounted) return;
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
        // focus after load
        setTimeout(() => h1Ref.current?.focus(), 0);
      } catch (err) {
        if ([401, 403].includes(err?.response?.status)) {
          navigate('/login?redirect=/admin/userlist');
          return;
        }
        setError(err?.response?.data?.detail || 'Error loading users');
        setLoading(false);
      }
    };

    fetchUsers();
    return () => { mounted = false; };
  }, [navigate, userInfo]);

  // Derived: filtered + paginated view
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      String(u.name || '').toLowerCase().includes(q) ||
      String(u.email || '').toLowerCase().includes(q) ||
      String(u._id || u.id || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    // if search or pageSize changes, reset to page 1
    setPage(1);
  }, [search, pageSize]);

  const deleteUserHandler = async (id) => {
    // prevent deleting yourself
    const selfId = String(userInfo?._id || userInfo?.id || '');
    if (String(id) === selfId) {
      setError('You cannot delete your own account.');
      return;
    }
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;

    try {
      setLoadingAction(true);
      await axiosInstance.delete(`/api/users/delete/${id}/`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setUsers(prev => prev.filter(u => String(u._id) !== String(id)));
      setLoadingAction(false);
    } catch (err) {
      if ([401, 403].includes(err?.response?.status)) {
        navigate('/login?redirect=/admin/userlist');
        return;
      }
      setError(err?.response?.data?.detail || 'Error deleting user');
      setLoadingAction(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 tabIndex={-1} ref={h1Ref}>Users</h1>
        <div className="d-flex align-items-center gap-2">
          <Form.Select
            size="sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}/page</option>)}
          </Form.Select>
          <InputGroup size="sm">
            <Form.Control
              placeholder="Search name, email, ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search users"
            />
            <Button variant="outline-secondary" onClick={() => setSearch('')}>Clear</Button>
          </InputGroup>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : filtered.length === 0 ? (
        <Message variant="info">No users found.</Message>
      ) : (
        <>
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead>
              <tr>
                <th style={{width: '120px'}}>ID</th>
                <th>NAME</th>
                <th>EMAIL</th>
                <th style={{width: '90px'}}>ADMIN</th>
                <th style={{width: '120px'}}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(user => (
                <tr key={user._id}>
                  <td className="text-truncate" title={user._id}>{user._id}</td>
                  <td>{user.name}</td>
                  <td>
                    <a href={`mailto:${user.email}`} className="text-decoration-none">{user.email}</a>
                  </td>
                  <td>{user.isAdmin ? 'Yes' : 'No'}</td>
                  <td className="d-flex gap-2">
                    <Button
                      variant="light"
                      className="btn-sm"
                      onClick={() => navigate(`/admin/user/${user._id}`)}
                    >
                      <i className="fas fa-edit" />
                    </Button>
                    <Button
                      variant="danger"
                      className="btn-sm"
                      disabled={loadingAction}
                      onClick={() => deleteUserHandler(user._id)}
                    >
                      <i className="fas fa-trash" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <Pagination className="mt-2">
              <Pagination.First onClick={() => setPage(1)} disabled={safePage === 1} />
              <Pagination.Prev onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} />
              {Array.from({ length: totalPages }).map((_, i) => (
                <Pagination.Item
                  key={i + 1}
                  active={i + 1 === safePage}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} />
              <Pagination.Last onClick={() => setPage(totalPages)} disabled={safePage === totalPages} />
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}

export default UserListScreen;
