import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

function Hero() {
  const handleShopNowClick = (e) => {
    e.preventDefault();
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="hero-section">
      <div className="hero-overlay">
        <Container>
          <Row className="align-items-center justify-content-center text-center">
            <Col md={8} lg={6}>
              <h1 className="hero-title">Welcome to Handmade Market</h1>
              <p className="hero-text">
                Discover unique, handcrafted products made with love and passion.
                Support local artisans and find the perfect item just for you.
              </p>
              <a href="#products" className="btn btn-primary btn-lg" onClick={handleShopNowClick}>
                Shop Now
              </a>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}

export default Hero;
