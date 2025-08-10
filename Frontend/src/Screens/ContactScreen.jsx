import React, { useMemo, useState } from 'react';
import { Container, Image, Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { usePage } from '../hooks/usePage';
import { setMeta, preloadImage } from '../lib/seo.js';
import { listPress } from '../lib/pressClient';

function ContactScreen() {
  const { page, loading, error } = usePage('contact');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');
  const onSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!/.+@.+\..+/.test(String(email))) { setFormError('Enter a valid email'); return; }
    if (!name.trim() || !message.trim()) { setFormError('All fields required'); return; }
    setSent(true);
    setName(''); setEmail(''); setMessage('');
  };
  const [press, setPress] = React.useState([]);
  React.useEffect(() => { (async () => { const { items } = await listPress(); setPress(items || []); })(); }, []);

  if (page) {
    const hero = page.hero_url || null;
    setMeta({ title: `${page.title || 'Contact'} – Handmade Hub`, description: page?.body_md?.slice(0, 140) || "Contact Handmade Hub", image: hero, type: 'article' });
    if (hero) preloadImage(hero);
  } else {
    setMeta({ title: 'Contact – Handmade Hub', description: "Contact Handmade Hub" });
  }

  return (
    <Container className="mt-3">
      <h1 className='mb-3' style={{ fontFamily:'Playfair Display, serif' }}>Contact</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : !page ? (
        <Message variant="info">Contact page is not published yet.</Message>
      ) : (
        <Row className='g-4'>
          <Col md={7}>
            {page.body_md ? (
              <p className='text-muted'>{page.body_md}</p>
            ) : (
              <p className='text-muted'>We'd love to hear from you. Use the form below.</p>
            )}
            {sent && <Alert variant='success'>Thanks for reaching out. We’ll reply soon.</Alert>}
            <Form onSubmit={onSubmit} noValidate>
              <Form.Group className='mb-3' controlId='contact-name'>
                <Form.Label>Name</Form.Label>
                <Form.Control type='text' value={name} onChange={(e)=>setName(e.target.value)} placeholder='Your name' autoComplete='name' required />
              </Form.Group>
              <Form.Group className='mb-3' controlId='contact-email'>
                <Form.Label>Email</Form.Label>
                <Form.Control type='email' value={email} onChange={(e)=>setEmail(e.target.value)} placeholder='you@example.com' autoComplete='email' required />
              </Form.Group>
              <Form.Group className='mb-3' controlId='contact-message'>
                <Form.Label>Message</Form.Label>
                <Form.Control as='textarea' rows={5} value={message} onChange={(e)=>setMessage(e.target.value)} placeholder='How can we help?' required />
              </Form.Group>
              {formError && <div className='text-danger mb-2' role='alert' aria-live='polite'>{formError}</div>}
              <div className='d-flex align-items-center justify-content-between'>
                <div className='text-muted small'>We rate-limit submissions to prevent spam.</div>
                <Button type='submit' variant='primary'>Send</Button>
              </div>
            </Form>
          </Col>
          <Col md={5}>
            {page.hero_url && <Image src={page.hero_url} alt={page.title || 'Contact'} fluid className="mb-3" />}
            <Card className='shadow-sm'>
              <Card.Body>
                <Card.Title>Stockists</Card.Title>
                <div className='text-muted small mb-2'>Selected press & partners</div>
                <div className='d-flex flex-wrap gap-3 align-items-center' style={{ filter:'grayscale(1)', opacity:0.85 }}>
                  {(press || []).slice(0,6).map((p) => (
                    <div key={p.id} className='d-inline-flex align-items-center' style={{ height: 32 }}>
                      {p.hero_url ? (
                        <img src={p.hero_url} alt={p.title} style={{ maxHeight: 32, maxWidth: 96, objectFit:'contain' }} />
                      ) : (
                        <span className='text-muted'>{p.title}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default ContactScreen;


