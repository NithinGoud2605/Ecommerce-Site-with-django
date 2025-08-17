import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

export default function CollectionCard({ collection, large = false }) {
  const ratio = large ? '42%' : '60%';
  const reduce = useReducedMotion();
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: reduce ? 0 : 0.45, ease: [0.33,1,0.68,1] }}>
      <Link to={`/collection/${collection.slug}`} className='text-decoration-none text-dark'>
        <div className='rounded-2' style={{ overflow: 'hidden', boxShadow: '0 12px 24px rgba(0,0,0,0.05)' }}>
          <div style={{ position: 'relative', paddingTop: ratio }}>
            {collection.hero_media?.url && (
              <picture>
                <source srcSet={collection.hero_media.url.replace(/\.[^.]+$/, '.avif')} type='image/avif' />
                <source srcSet={collection.hero_media.url.replace(/\.[^.]+$/, '.webp')} type='image/webp' />
                <img src={collection.hero_media.url} alt={collection.title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
              </picture>
            )}
            {/* type-only overlay on hover */}
            <div className='position-absolute bottom-0 start-0 end-0 p-3' style={{ background:'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%)' }}>
              <div className='text-white text-uppercase' style={{ letterSpacing: '0.08em', fontSize: '0.8rem' }}>{collection.season || 'Lookbook'}</div>
              <div className='text-white' style={{ fontFamily: 'Playfair Display, serif', fontSize: large ? '2.25rem' : '1.5rem' }}>{collection.title}</div>
            </div>
            <div className='position-absolute top-0 start-0 end-0 bottom-0 d-flex align-items-end justify-content-start p-3' style={{ pointerEvents:'none', background:'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.35) 100%)', opacity:0, transition:'opacity 200ms' }}>
              <div className='text-white text-uppercase' style={{ letterSpacing:'0.08em' }}>{collection.season || 'Lookbook'}</div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}


