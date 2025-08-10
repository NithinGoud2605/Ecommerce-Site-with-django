import React, { useEffect } from 'react';
import { Container, Card } from 'react-bootstrap';
import { useCart } from '../state/cartStore.jsx';
import { setMeta } from '../lib/seo.js';

export default function SuccessScreen() {
  const { clear } = useCart();
  useEffect(() => { clear(); }, [clear]);
  useEffect(() => {
    setMeta({ title: 'Order Received – Handmade Hub', description: 'Thank you for your order.' });
  }, []);
  return (
    <Container className='mt-4'>
      <Card className='p-4 shadow-sm'>
        <h1>Thank you</h1>
        <p>Your order has been received. Payment will be added later. You’ll receive an email with next steps.</p>
      </Card>
    </Container>
  );
}


