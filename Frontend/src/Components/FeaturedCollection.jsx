import React, { useMemo } from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

export default function FeaturedCollection({ collection }) {
  if (!collection) return null;
  const reduce = useReducedMotion();
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, ease: [0.33,1,0.68,1] }}>
      <Card className='rounded-2' style={{ overflow: 'hidden', boxShadow: '0 12px 24px rgba(0,0,0,0.05)' }}>
        <Link to={`/collection/${collection.slug}`} className='text-decoration-none text-dark'>
          {collection.hero_media?.url && (
            <div style={{ position: 'relative', paddingTop: '50%', overflow:'hidden' }}>
              <img
                src={collection.hero_media.url}
                alt={collection.title}
                style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', transform: 'translateZ(0)' }}
                onMouseMove={reduce ? undefined : (e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const dx = (e.clientX - rect.left) / rect.width - 0.5;
                  const dy = (e.clientY - rect.top) / rect.height - 0.5;
                  e.currentTarget.style.transform = `scale(1.05) translate(${dx * 6}px, ${dy * 6}px)`;
                }}
                onMouseLeave={reduce ? undefined : (e) => { e.currentTarget.style.transform = 'scale(1) translate(0,0)'; }}
              />
            </div>
          )}
          <Card.Body>
            <div className='text-uppercase text-muted' style={{ letterSpacing: '0.08em', fontSize: '0.8rem' }}>Lookbook</div>
            <Card.Title className='mt-1' style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem' }}>{collection.title}</Card.Title>
            {collection.summary && <Card.Text className='mt-2'>{collection.summary}</Card.Text>}
          </Card.Body>
        </Link>
      </Card>
    </motion.div>
  );
}


