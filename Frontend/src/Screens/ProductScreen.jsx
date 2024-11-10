import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Image, ListGroup, Button, Card, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import Rating from '../components/Rating';
import Loader from '../components/Loader';
import Message from '../components/Message';

function ProductScreen() {
  const { id: productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState({});
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loadingReview, setLoadingReview] = useState(false);
  const [errorReview, setErrorReview] = useState(null);
  const [successReview, setSuccessReview] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/products/${productId}/`);
        setProduct(data);
        setLoading(false);
      } catch (err) {
        setError(err.response && err.response.data.detail ? err.response.data.detail : 'Error loading product');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, successReview]);

  const addToCartHandler = () => {
    navigate(`/cart/${productId}?qty=${qty}`);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoadingReview(true);
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      await axios.post(`/api/products/${productId}/reviews/`, { rating, comment }, config);
      setSuccessReview(true);
      setRating(0);
      setComment('');
      setLoadingReview(false);
    } catch (err) {
      setErrorReview(err.response && err.response.data.detail ? err.response.data.detail : 'Error submitting review');
      setLoadingReview(false);
    }
  };

  return (
    <div>
      <Link to='/' className='btn btn-light my-3'>
        Go Back
      </Link>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <div>
          <Row>
            <Col md={6}>
              <Image src={product.image} alt={product.name} fluid rounded className='shadow-sm' />
            </Col>
            <Col md={3}>
              <ListGroup variant="flush">
                <ListGroup.Item className='border-0'>
                  <h3 className='text-primary'>{product.name}</h3>
                </ListGroup.Item>
                <ListGroup.Item className='border-0'>
                  <Rating value={Number(product.rating)} text={`${product.numReviews || 0} reviews`} color={'#f8e825'} />
                </ListGroup.Item>
                <ListGroup.Item className='border-0'>
                  <strong>Price:</strong> ${product.price}
                </ListGroup.Item>
                <ListGroup.Item className='border-0'>
                  <strong>Description:</strong> {product.description}
                </ListGroup.Item>
              </ListGroup>
            </Col>
            <Col md={3}>
              <Card className='shadow-sm'>
                <ListGroup variant='flush'>
                  <ListGroup.Item className='border-0'>
                    <Row>
                      <Col>Price:</Col>
                      <Col>
                        <strong>${product.price}</strong>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item className='border-0'>
                    <Row>
                      <Col>Status:</Col>
                      <Col>{product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}</Col>
                    </Row>
                  </ListGroup.Item>
                  {product.countInStock > 0 && (
                    <ListGroup.Item className='border-0'>
                      <Row>
                        <Col>Qty</Col>
                        <Col xs='auto' className='my-1'>
                          <Form.Control as="select" value={qty} onChange={(e) => setQty(Number(e.target.value))} className='rounded'>
                            {[...Array(product.countInStock).keys()].map((x) => (
                              <option key={x + 1} value={x + 1}>
                                {x + 1}
                              </option>
                            ))}
                          </Form.Control>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  )}
                  <ListGroup.Item className='border-0'>
                    <Button onClick={addToCartHandler} className='btn-block btn-primary' disabled={product.countInStock === 0} type='button'>
                      Add to Cart
                    </Button>
                  </ListGroup.Item>
                </ListGroup>
              </Card>
            </Col>
          </Row>
          <Row className='mt-4'>
            <Col md={6}>
              <h4 className='text-primary'>Customer Reviews</h4>
              {product.reviews && product.reviews.length === 0 && <Alert variant='info'>No reviews yet. Be the first to review!</Alert>}
              <ListGroup variant='flush'>
                {product.reviews &&
                  product.reviews.map((review) => (
                    <ListGroup.Item key={review._id} className='border-0'>
                      <div className="d-flex justify-content-between">
                        <strong>{review.name}</strong>
                        <Rating value={Number(review.rating)} color='#f8e825' />
                      </div>
                      <p className='text-muted'>{new Date(review.createdAt).toLocaleDateString()}</p>
                      <p>{review.comment}</p>
                      <hr />
                    </ListGroup.Item>
                  ))}
                <ListGroup.Item className='border-0'>
                  <h4 className='text-primary'>Leave a Review</h4>
                  {loadingReview && <Loader />}
                  {successReview && <Message variant='success'>Review submitted successfully!</Message>}
                  {errorReview && <Message variant='danger'>{errorReview}</Message>}
                  {userInfo ? (
                    <Form onSubmit={submitHandler} className='mt-3'>
                      <Form.Group controlId='rating' className="mb-3">
                        <Form.Label>Rating</Form.Label>
                        <Form.Control as='select' value={rating} onChange={(e) => setRating(Number(e.target.value))} className='rounded'>
                          <option value=''>Select...</option>
                          <option value='1'>1 - Poor</option>
                          <option value='2'>2 - Fair</option>
                          <option value='3'>3 - Good</option>
                          <option value='4'>4 - Very Good</option>
                          <option value='5'>5 - Excellent</option>
                        </Form.Control>
                      </Form.Group>
                      <Form.Group controlId='comment' className="mb-3">
                        <Form.Label>Comment</Form.Label>
                        <Form.Control
                          as='textarea'
                          rows='4'
                          value={comment}
                          placeholder="Share your thoughts about the product"
                          onChange={(e) => setComment(e.target.value)}
                          className='rounded'
                        ></Form.Control>
                      </Form.Group>
                      <Button disabled={loadingReview} type='submit' variant='primary' className='rounded'>
                        Submit Review
                      </Button>
                    </Form>
                  ) : (
                    <Message variant='info'>
                      Please <Link to='/login'>log in</Link> to write a review.
                    </Message>
                  )}
                </ListGroup.Item>
              </ListGroup>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}

export default ProductScreen;
