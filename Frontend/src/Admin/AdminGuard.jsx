import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import axios from '../axiosInstance';

export default function AdminGuard({ children }) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function check() {
      if (loading) return;
      try {
        // bootstrap from localStorage first
        const stored = JSON.parse(localStorage.getItem('userInfo') || 'null');
        if (!stored || !stored.token) { navigate('/login'); return; }
        if (stored.isAdmin) { setIsAdmin(true); setChecking(false); return; }
        // fallback: ask backend profile
        const { data } = await axios.get('/api/users/profile/');
        setIsAdmin(!!data?.isAdmin);
      } catch (e) {
        setError(e?.response?.data?.detail || e?.message || 'Failed to check admin');
      } finally {
        setChecking(false);
      }
    }
    check();
  }, [user, loading, navigate]);

  if (loading || checking) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!isAdmin) return <Message variant="danger">Access denied</Message>;
  return <>{children}</>;
}


