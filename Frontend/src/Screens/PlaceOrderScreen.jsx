import React, { useState, useEffect } from 'react';
import { Button, Row, Col, ListGroup, Image, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance'; // Use axiosInstance for consistent handling
import Message from '../Components/Message';
import CheckoutSteps from '../components/CheckoutSteps';

function PlaceOrderScreen() {
  const [cart, setCart] = useState({
    cartItems: [],
    shippingAddress: {},
    paymentMethod: '',
    itemsPrice: 0,
    shippingPrice: 0,
    taxPrice: 0,
    totalPrice: 0,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const storedShippingAddress = JSON.parse(localStorage.getItem('shippingAddress')) || {};
    const storedPaymentMethod = localStorage.getItem('paymentMethod') || '';

    const itemsPrice = storedCartItems.reduce((acc, item) => acc + item.price * item.qty, 0).toFixed(2);
    const shippingPrice = (itemsPrice > 100 ? 0 : 10).toFixed(2);
    const taxPrice = (Number(itemsPrice) * 0.082).toFixed(2);
    const totalPrice = (Number(itemsPrice) + Number(shippingPrice) + Number(taxPrice)).toFixed(2);

    setCart({
      cartItems: storedCartItems,
      shippingAddress: storedShippingAddress,
      paymentMethod: storedPaymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    });
  }, []);

  const placeOrder = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));

      if (!userInfo) {
        navigate('/login');
        return;
      }

      const { data } = await axiosInstance.post('/api/orders/add/', {
        orderItems: cart.cartItems,
        shippingAddress: cart.shippingAddress,
        paymentMethod: cart.paymentMethod,
        itemsPrice: cart.itemsPrice,
        shippingPrice: cart.shippingPrice,
        taxPrice: cart.taxPrice,
        totalPrice: cart.totalPrice,
      });

      setOrder(data);
      setLoading(false);

      // Clear the cart from local storage upon successful order placement
      localStorage.removeItem('cartItems');
      navigate(`/order/${data._id}`);
    } catch (error) {
      setError(
        error.response?.data?.detail || 'An error occurred while placing the order.'
      );
      setLoading(false);
    }
  };

  return (
    <div>
      <CheckoutSteps step1 step2 step3 step4 />
      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>
            <ListGroup.Item>
              <h2>Shipping</h2>
              <p>
                <strong>Address: </strong>
                {cart.shippingAddress.address}, {cart.shippingAddress.city},{' '}
                {cart.shippingAddress.postalCode}, {cart.shippingAddress.country}
              </p>
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Payment Method</h2>
              <p>
                <strong>Method: </strong>
                {cart.paymentMethod}
              </p>
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Order Items</h2>
              {cart.cartItems.length === 0 ? (
                <Message variant='info'>Your cart is empty</Message>
              ) : (
                <ListGroup variant='flush'>
                  {cart.cartItems.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row>
                        <Col md={1}>
                          <Image src={item.image} alt={item.name} fluid rounded />
                        </Col>
                        <Col>
                          <Link to={`/product/${item.product}`}>{item.name}</Link>
                        </Col>
                        <Col md={4}>
                          {item.qty} x ${item.price} = ${(item.qty * item.price).toFixed(2)}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>

        <Col md={4}>
          <Card>
            <ListGroup variant='flush'>
              <ListGroup.Item>
                <h2>Order Summary</h2>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Items:</Col>
                  <Col>${cart.itemsPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Shipping:</Col>
                  <Col>${cart.shippingPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax:</Col>
                  <Col>${cart.taxPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Total:</Col>
                  <Col>${cart.totalPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                {error && <Message variant='danger'>{error}</Message>}
              </ListGroup.Item>
              <ListGroup.Item>
                <Button
                  type='button'
                  className='btn-block'
                  disabled={cart.cartItems.length === 0}
                  onClick={placeOrder}
                >
                  Place Order
                </Button>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default PlaceOrderScreen;
