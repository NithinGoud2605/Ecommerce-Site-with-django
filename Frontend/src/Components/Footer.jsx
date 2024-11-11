// Footer.js
import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";

function Footer() {
  return (
    <footer className="custom-footer">
      <Container>
        <Row className="py-4">
          <Col md={4} className="text-center text-md-start mb-3 mb-md-0">
            <h5 className="footer-brand">Handmade HUB</h5>
            <p>Your go-to platform for quality products and excellent service.</p>
          </Col>
          <Col md={4} className="text-center mb-3 mb-md-0">
            <h6>Follow Us</h6>
            <div className="social-icons d-flex justify-content-center">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <FaFacebookF />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <FaTwitter />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <FaInstagram />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <FaLinkedinIn />
              </a>
            </div>
          </Col>
          <Col md={4} className="text-center text-md-end">
            <h6>Contact Us</h6>
            <p>Email: support@name.com</p>
            <p>Phone: +1 234 567 890</p>
          </Col>
        </Row>
        <Row>
          <Col className="text-center py-3">&copy; {new Date().getFullYear()} . All Rights Reserved.</Col>
        </Row>
      </Container>

    </footer>
  );
}

export default Footer;
