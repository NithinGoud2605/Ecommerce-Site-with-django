import React, { useMemo } from 'react';
import { Card, ListGroup, Alert } from 'react-bootstrap';
import { useCart } from '../state/cartStore.jsx';
import { formatMoney } from '../utils/money.js';

export default function CartTotals({ cta, disabled }) {
  const { items, subtotal_cents } = useCart();
  const shipping_cents = 0; // placeholder
  const total_cents = useMemo(() => (subtotal_cents + shipping_cents), [subtotal_cents]);
  const FREE_SHIPPING_THRESHOLD = 20000; // $200

  return (
    <Card className='shadow-sm'>
      <ListGroup variant='flush'>
        <ListGroup.Item className='border-0'>
          <h2 className='text-center'>Subtotal ({items.reduce((a, b) => a + b.qty, 0)}) items</h2>
          <h4 className='text-center text-success'>{formatMoney({ amount_cents: subtotal_cents })}</h4>
        </ListGroup.Item>
        <ListGroup.Item className='border-0 pt-0'>
          {subtotal_cents >= FREE_SHIPPING_THRESHOLD ? (
            <Alert variant='success' className='mb-0'>You qualify for free shipping.</Alert>
          ) : (
            <Alert variant='light' className='mb-0'>Spend {formatMoney({ amount_cents: Math.max(FREE_SHIPPING_THRESHOLD - subtotal_cents, 0) })} more for free shipping.</Alert>
          )}
        </ListGroup.Item>
        <ListGroup.Item className='border-0'>
          <div className='d-flex justify-content-between text-muted'>
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
        </ListGroup.Item>
        <ListGroup.Item className='border-0 text-muted' style={{ fontSize: '0.9rem' }}>
          Estimated tax & duties calculated at checkout.
        </ListGroup.Item>
        <ListGroup.Item className='border-0'>
          <div className='d-flex justify-content-between'>
            <strong>Estimated total</strong>
            <strong>{formatMoney({ amount_cents: total_cents })}</strong>
          </div>
        </ListGroup.Item>
        {cta}
      </ListGroup>
    </Card>
  );
}


