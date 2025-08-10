import { useCallback, useEffect, useState } from 'react';
import { getSession, onAuthStateChange, signInWithEmail, signOut as sbSignOut, signUpWithEmail, resetPassword as sbReset } from '../auth/authClient';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        const { data } = await getSession();
        setUser(data?.session?.user || null);
      } finally {
        setLoading(false);
      }
    })();
    const sub = onAuthStateChange((u) => setUser(u));
    unsub = () => sub?.data?.subscription?.unsubscribe?.();
    return () => unsub();
  }, []);

  const signIn = useCallback(async (email, password) => {
    setError(null);
    const { user, error } = await signInWithEmail(email, password);
    if (error) setError(error.message);
    return { user, error };
  }, []);

  const signUp = useCallback(async (email, password) => {
    setError(null);
    const { user, error } = await signUpWithEmail(email, password);
    if (error) setError(error.message);
    return { user, error };
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    const { error } = await sbSignOut();
    if (error) setError(error.message);
    return { error };
  }, []);

  const resetPassword = useCallback(async (email) => {
    setError(null);
    const { error } = await sbReset(email);
    if (error) setError(error.message);
    return { error };
  }, []);

  return { user, loading, error, signIn, signUp, signOut, resetPassword };
}


