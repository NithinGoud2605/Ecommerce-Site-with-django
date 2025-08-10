import React from 'react';
import { Container, Row, Col, Image } from 'react-bootstrap';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { usePage } from '../hooks/usePage';
import { setMeta, preloadImage } from '../lib/seo.js';

function AboutScreen() {
  const { page, loading, error } = usePage('about');

  if (page) {
    const hero = page.hero_url || null;
    setMeta({ title: `${page.title || 'About'} – Handmade Hub`, description: page?.body_md?.slice(0, 140) || 'About Handmade Hub', image: hero, type: 'article' });
    if (hero) preloadImage(hero);
  } else {
    setMeta({ title: 'About – Handmade Hub', description: 'About Handmade Hub' });
  }

  return (
    <>
      {/* Hero with manifesto overlay */}
      {page?.hero_url && (
        <div className="mb-4" style={{ position:'relative' }}>
          <div style={{ position:'relative', paddingTop: '42%' }}>
            <img src={page.hero_url} alt={page.title || 'About'} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
            <div className='position-absolute bottom-0 start-0 end-0 p-3 p-md-5' style={{ background:'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)' }}>
              <h1 className='text-white' style={{ fontFamily:'Playfair Display, serif', fontSize:'clamp(2rem,4vw,3rem)' }}>{page.title || 'About'}</h1>
              <p className='text-white-50 mb-0' style={{ maxWidth: 720 }}>A quiet manifesto for enduring forms, considered materials, and human hands.</p>
            </div>
          </div>
        </div>
      )}

      <Container className="mb-5">
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : !page ? (
          <Message variant="info">About page is not published yet.</Message>
        ) : (
          <Row className='g-4 align-items-start'>
            <Col md={6}>
              {/* Atelier / process imagery */}
              {page.hero_url ? (
                <div className='d-grid gap-3' style={{ gridTemplateColumns:'1fr 1fr' }}>
                  <Image src={page.hero_url} alt='Atelier' fluid rounded style={{ objectFit:'cover' }} />
                  <div className='bg-light rounded' style={{ minHeight: 180 }} />
                  <div className='bg-light rounded d-none d-md-block' style={{ minHeight: 180 }} />
                  <div className='bg-light rounded d-none d-md-block' style={{ minHeight: 180 }} />
                </div>
              ) : (
                <div className='bg-light rounded' style={{ minHeight: 320 }} />
              )}
            </Col>
            <Col md={6}>
              <div className='prose-fashion' style={{ whiteSpace:'pre-wrap' }}>
                {page.body_md || 'We are a studio guided by craftsmanship and purpose.'}
              </div>
            </Col>
          </Row>
        )}
      </Container>
    </>
  );
}

export default AboutScreen;


