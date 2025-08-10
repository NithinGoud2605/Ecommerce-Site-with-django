import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import Loader from '../Components/Loader';
import Message from '../Components/Message';

export default function AdminGuard({ children }) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function check() {
      if (loading) return;
      if (!user) {
        navigate('/login');
        return;
      }
      try {
        setChecking(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle();
        if (error) throw error;
        setIsAdmin(!!data?.is_admin);
      } catch (e) {
        setError(e?.message || 'Failed to check admin');
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


