import { useEffect, useState } from 'react';
import { getPageBySlug } from '../lib/catalogClient';

/**
 * usePage
 * @param {string} slug
 * @returns {{ page: any|null, loading: boolean, error: string|null }}
 */
export function usePage(slug) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      const res = await getPageBySlug(slug);
      if (!mounted) return;
      if (res?.error) {
        setError(res.error);
        setPage(null);
      } else {
        setError(null);
        setPage(res.page || null);
      }
      setLoading(false);
    }
    run();
    return () => {
      mounted = false;
    };
  }, [slug]);

  return { page, loading, error };
}



