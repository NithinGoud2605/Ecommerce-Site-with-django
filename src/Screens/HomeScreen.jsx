import React from 'react';
import { Row, Col } from 'react-bootstrap';
import Product from '../Components/Product';
import products from '../products';
import Hero from '../Components/Hero'; // Import the Hero component

function HomeScreen() {
  return (
    <>
      <Hero /> {/* Add the Hero component here */}
      <h1 id="products" className="mt-4">Latest Products</h1>
      <Row>
        {products.map((product) => (
          <Col key={product._id} sm={12} md={6} lg={4} xl={3}>
            <Product product={product} />
          </Col>
        ))}
      </Row>
    </>
  );
}

export default HomeScreen;
