import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Form, Button } from 'react-bootstrap';
import Message from '../Components/Message';
import { useCart } from '../state/cartStore.jsx';
import CartTotals from '../Components/CartTotals.jsx';
import { setMeta } from '../lib/seo.js';
import { useCatalogList } from '../hooks/useCatalogList';
import Product from '../Components/Product';

function CartScreen() {
  const navigate = useNavigate();
  const { items: cartItems, setQty, removeItem } = useCart();
  const checkoutHandler = () => navigate('/login?redirect=shipping');

  React.useEffect(() => {
    setMeta({ title: 'Cart – Handmade Hub', description: 'Review your cart and proceed to checkout.' });
  }, []);

  // Recommend items based on first cart item's gender if available
  const cartGender = useMemo(() => {
    const first = cartItems?.[0];
    return first?.gender || undefined;
  }, [cartItems]);
  // Pull recently viewed fallback
  const recently = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('recently_viewed_products') || '[]'); } catch { return []; }
  }, []);
  const { items: also, loading: alsoLoading } = useCatalogList({ gender: cartGender, sort: 'newest', page: 1, pageSize: 8 });

  return (
    <Row>
      <Col md={8}>
        <h1 className='text-primary'>Shopping Cart</h1>
        {cartItems.length === 0 ? (
          <Message variant='info'>
            Your cart is empty. <Link to='/shop'>Go back to Shop</Link>
          </Message>
        ) : (
          <ListGroup variant='flush'>
            {cartItems.map((item) => (
              <ListGroup.Item key={item.variantId} className='border-0 shadow-sm mb-2'>
                <Row className='align-items-center'>
                  <Col md={2}>
                    <Image src={item.image_path} alt={item.name} fluid rounded className='border' />
                  </Col>
                  <Col md={3}>
                    <Link to={`/product/${item.productId || ''}`} className='text-decoration-none text-dark'>{item.name}</Link>
                    <div className='text-muted small'>{[item.size, item.color].filter(Boolean).join(' · ')}</div>
                  </Col>
                  <Col md={2} className='text-success'>${(item.price_cents / 100).toFixed(2)}</Col>
                  <Col md={3}>
                    <Form.Control
                      as='select'
                      value={item.qty}
                      onChange={(e) => setQty(item.variantId, Number(e.target.value))}
                      className='rounded'
                    >
                      {Array.from({ length: 20 }).map((_, x) => (
                        <option key={x + 1} value={x + 1}>{x + 1}</option>
                      ))}
                    </Form.Control>
                  </Col>
                  <Col md={1}>
                    <Button
                      type='button'
                      variant='danger'
                      onClick={() => removeItem(item.variantId)}
                      className='btn-sm'
                    >
                      <i className='fas fa-trash'></i>
                    </Button>
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Col>

      <Col md={4}>
        <CartTotals
          cta={(
            <ListGroup.Item className='border-0'>
              <Button type='button' className='btn-block btn-primary w-100' disabled={cartItems.length === 0} onClick={checkoutHandler}>
                Proceed To Checkout
              </Button>
            </ListGroup.Item>
          )}
        />
        {(also.length > 0 || recently.length > 0) && (
          <div className='mt-4'>
            <h5>You may also like</h5>
            <div className='d-flex overflow-auto gap-3 pb-2'>
              {(also.length ? also : recently).map((p) => (
                <div key={p._id || p.id} style={{ minWidth: 220 }}>
                  <Product product={{ _id: p._id || p.id, name: p.name, image: p.image }} enableQuickAdd={true} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Col>
    </Row>
  );
}

export default CartScreen;