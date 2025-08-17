import { useCallback, useEffect, useState } from 'react';
import axios from '../axiosInstance';

function getStoredUser() {
  try {
    const stored = JSON.parse(localStorage.getItem('userInfo') || 'null');
    if (stored && stored.token) {
      return { id: stored.id, email: stored.email, isAdmin: !!stored.isAdmin };
    }
  } catch {}
  return null;
}

export function useAuth() {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep user in sync if another tab logs out/in
  useEffect(() => {
    const onStorage = () => setUser(getStoredUser());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const signIn = useCallback(async (email, password) => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.post('/api/users/login/', { username: email, password });
      const normalized = {
        id: data.id || data._id || data.user_id,
        email: data.email || data.username,
        token: data.token,
        isAdmin: !!data.isAdmin,
        provider: 'django',
      };
      localStorage.setItem('userInfo', JSON.stringify(normalized));
      setUser({ id: normalized.id, email: normalized.email, isAdmin: normalized.isAdmin });
      return { user: normalized, error: null };
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Login failed');
      return { user: null, error: e };
    } finally { setLoading(false); }
  }, []);

  const signUp = useCallback(async (name, email, password) => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.post('/api/users/register/', { name, email, password });
      const normalized = {
        id: data.id || data._id,
        email: data.email,
        token: data.token,
        isAdmin: !!data.isAdmin,
        provider: 'django',
      };
      localStorage.setItem('userInfo', JSON.stringify(normalized));
      setUser({ id: normalized.id, email: normalized.email, isAdmin: normalized.isAdmin });
      return { user: normalized, error: null };
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Registration failed');
      return { user: null, error: e };
    } finally { setLoading(false); }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try { localStorage.removeItem('userInfo'); setUser(null); } catch {}
    return { error: null };
  }, []);

  const resetPassword = useCallback(async (_email) => ({ error: 'Not implemented' }), []);

  return { user, loading, error, signIn, signUp, signOut, resetPassword };
}


