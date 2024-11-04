// src/Screens/ProductScreen.jsx
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Row, Col, Image, ListGroup, Button, Card } from 'react-bootstrap';

import Rating from '../Components/Rating';
import products from '../products';

function ProductScreen() {
  const { id } = useParams();
  const product = products.find((p) => p._id === id);

  return (
    <div>
      <Link to="/" className="btn btn-light my-3">
        Go Back
      </Link>
      <Row>
        <Col md={6}>
          <Image
            src={product.image}
            alt={product.name}
            fluid
            className="product-screen-image"
          />
        </Col>
        <Col md={3}>
          <ListGroup variant="flush" className="product-details">
            <ListGroup.Item>
              <h3 className="product-screen-title">{product.name}</h3>
            </ListGroup.Item>

            <ListGroup.Item>
              <Rating
                value={product.rating}
                text={`${product.numReviews} reviews`}
              />
            </ListGroup.Item>

            <ListGroup.Item>
              <strong>Price:</strong> ${product.price}
            </ListGroup.Item>

            <ListGroup.Item>
              <strong>Description:</strong> {product.description}
            </ListGroup.Item>
          </ListGroup>
        </Col>
        <Col md={3}>
          <Card className="product-screen-card">
            <ListGroup variant="flush">
              <ListGroup.Item>
                <Row>
                  <Col>
                    <strong>Price:</strong>
                  </Col>
                  <Col>
                    <strong>${product.price}</strong>
                  </Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col>
                    <strong>Status:</strong>
                  </Col>
                  <Col>
                    {product.countInStock > 0 ? (
                      <span className="text-success">In Stock</span>
                    ) : (
                      <span className="text-danger">Out of Stock</span>
                    )}
                  </Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Button
                  className="btn-block"
                  disabled={product.countInStock === 0}
                  type="button"
                >
                  Add to Cart
                </Button>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProductScreen;
