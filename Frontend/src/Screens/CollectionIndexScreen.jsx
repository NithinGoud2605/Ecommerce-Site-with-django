import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { listCollections } from '../lib/catalogClient';
import CollectionCard from '../Components/CollectionCard';
import { setMeta } from '../lib/seo.js';

function CollectionIndexScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    let mounted = true;
    window.scrollTo(0, 0);
    // SEO
    setMeta({
      title: 'Collections – Handmade Hub',
      description: 'Explore our seasonal collections and curated looks.',
    });
    async function run() {
      setLoading(true);
      const res = await listCollections();
      if (!mounted) return;
      if (Array.isArray(res)) {
        setCollections(res);
        setError(null);
      } else if (res?.error) {
        setError(res.error);
      }
      setLoading(false);
    }
    run();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Container className="mt-3">
      <h1 style={{ fontFamily: 'Playfair Display, serif' }}>Collections</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : collections.length === 0 ? (
        <Message variant="info">No collections available</Message>
      ) : (
        <div className="d-grid gap-4" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
          {collections.map((c, i) => (
            <div key={c.id} style={{ gridColumn: (i % 7 === 0) ? 'span 8' : (i % 5 === 0 ? 'span 6' : 'span 4') }}>
              <CollectionCard collection={c} large={i % 7 === 0} />
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}

export default CollectionIndexScreen;


