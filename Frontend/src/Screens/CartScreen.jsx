import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Form, Button, Card } from 'react-bootstrap';
import axiosInstance from '../axiosInstance'; // Replaced axios with axiosInstance
import Message from '../Components/Message';

function CartScreen() {
  const { id: productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const qty = Number(searchParams.get('qty')) || 1;

  const [cartItems, setCartItems] = useState([]);

  // Helper to save cart to localStorage
  const saveCartToLocalStorage = (items) => {
    localStorage.setItem('cartItems', JSON.stringify(items));
  };

  // Helper to load cart from localStorage
  const loadCartFromLocalStorage = () => {
    return JSON.parse(localStorage.getItem('cartItems')) || [];
  };

  useEffect(() => {
    const fetchCartItems = async () => {
      const storedCartItems = loadCartFromLocalStorage();

      if (productId) {
        // Check if item is already in cart
        const itemExists = storedCartItems.find((item) => item.product === productId);

        if (itemExists) {
          // Update quantity of existing item
          const updatedCartItems = storedCartItems.map((item) =>
            item.product === productId ? { ...item, qty } : item
          );
          setCartItems(updatedCartItems);
          saveCartToLocalStorage(updatedCartItems);
        } else {
          // Fetch product details from backend
          try {
            const { data: product } = await axiosInstance.get(`/api/products/${productId}`);
            const newItem = {
              product: product._id || product.id,
              name: product.name,
              image: product.image,
              price: product.price,
              countInStock: product.countInStock,
              qty,
            };
            const updatedCartItems = [...storedCartItems, newItem];
            setCartItems(updatedCartItems);
            saveCartToLocalStorage(updatedCartItems);
          } catch (error) {
            console.error('Error fetching product details:', error);
          }
        }
      } else {
        // If no productId in URL, load cart from localStorage
        setCartItems(storedCartItems);
      }
    };

    fetchCartItems();
  }, [productId, qty]);

  const removeFromCartHandler = (id) => {
    const updatedCartItems = cartItems.filter((item) => item.product !== id);
    setCartItems(updatedCartItems);
    saveCartToLocalStorage(updatedCartItems);
  };

  const checkoutHandler = () => {
    navigate('/login?redirect=shipping');
  };

  // Fetch updated product details for cart items (to ensure latest price and stock)
  useEffect(() => {
    const updateCartItemsWithLatestData = async () => {
      const updatedCartItems = await Promise.all(
        cartItems.map(async (item) => {
          try {
            const { data: product } = await axiosInstance.get(`/api/products/${item.product}`);
            return {
              ...item,
              name: product.name,
              image: product.image,
              price: product.price,
              countInStock: product.countInStock,
            };
          } catch (error) {
            console.error('Error fetching product details:', error);
            return item;
          }
        })
      );
      setCartItems(updatedCartItems);
      saveCartToLocalStorage(updatedCartItems);
    };

    if (cartItems.length > 0) {
      updateCartItemsWithLatestData();
    }
  }, [cartItems.length]);

  return (
    <Row>
      <Col md={8}>
        <h1 className='text-primary'>Shopping Cart</h1>
        {cartItems.length === 0 ? (
          <Message variant='info'>
            Your cart is empty <Link to='/'>Go Back</Link>
          </Message>
        ) : (
          <ListGroup variant='flush'>
            {cartItems.map((item) => (
              <ListGroup.Item key={item.product} className='border-0 shadow-sm mb-2'>
                <Row className='align-items-center'>
                  <Col md={2}>
                    <Image src={item.image} alt={item.name} fluid rounded className='border' />
                  </Col>
                  <Col md={3}>
                    <Link to={`/product/${item.product}`} className='text-decoration-none text-dark'>{item.name}</Link>
                  </Col>
                  <Col md={2} className='text-success'>${item.price}</Col>
                  <Col md={3}>
                    <Form.Control
                      as='select'
                      value={item.qty}
                      onChange={(e) => {
                        const updatedQty = Number(e.target.value);
                        const updatedCartItems = cartItems.map((cartItem) =>
                          cartItem.product === item.product
                            ? { ...cartItem, qty: updatedQty }
                            : cartItem
                        );
                        setCartItems(updatedCartItems);
                        saveCartToLocalStorage(updatedCartItems);
                      }}
                      className='rounded'
                    >
                      {[...Array(item.countInStock).keys()].map((x) => (
                        <option key={x + 1} value={x + 1}>
                          {x + 1}
                        </option>
                      ))}
                    </Form.Control>
                  </Col>
                  <Col md={1}>
                    <Button
                      type='button'
                      variant='danger'
                      onClick={() => removeFromCartHandler(item.product)}
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
        <Card className='shadow-sm'>
          <ListGroup variant='flush'>
            <ListGroup.Item className='border-0'>
              <h2 className='text-center'>
                Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)}) items
              </h2>
              <h4 className='text-center text-success'>
                ${cartItems.reduce((acc, item) => acc + item.qty * item.price, 0).toFixed(2)}
              </h4>
            </ListGroup.Item>
            <ListGroup.Item className='border-0'>
              <Button
                type='button'
                className='btn-block btn-primary'
                disabled={cartItems.length === 0}
                onClick={checkoutHandler}
              >
                Proceed To Checkout
              </Button>
            </ListGroup.Item>
          </ListGroup>
        </Card>
      </Col>
    </Row>
  );
}

export default CartScreen;