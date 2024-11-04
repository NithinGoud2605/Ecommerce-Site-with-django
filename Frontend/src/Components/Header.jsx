// Header.js
import React from 'react';
import {
  Navbar,
  Nav,
  Container,
  NavDropdown,
  Form,
  FormControl,
  Button,
} from 'react-bootstrap';
import { FaShoppingCart, FaUser } from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';

function Header() {
  return (
    <header>
      <Navbar
        expand="lg"
        collapseOnSelect
        className="custom-navbar"
      >
        <Container>
          {/* Brand / Logo */}
          <LinkContainer to="/">
            <Navbar.Brand>
              <img
                alt="Logo"
                src="../public/logo.png" // Replace with your logo path
                width="200"
                height="200"
                className="d-inline-block align-top"
              />{' '}
            </Navbar.Brand>
          </LinkContainer>

          {/* Toggle for mobile view */}
          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          {/* Navbar Links and Search */}
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {/* Navigation Links */}
              <LinkContainer to="/">
                <Nav.Link>Home</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/shop">
                <Nav.Link>Shop</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/contact">
                <Nav.Link>Contact</Nav.Link>
              </LinkContainer>
            </Nav>

            {/* Search Bar */}
            <Form className="d-flex me-3">
              <FormControl
                type="search"
                placeholder="Search products..."
                className="me-2"
                aria-label="Search"
              />
              <Button variant="outline-light">Search</Button>
            </Form>

            {/* User and Cart Links */}
            <Nav>
              <LinkContainer to="/cart">
                <Nav.Link>
                  <FaShoppingCart /> Cart <span className="badge bg-secondary">0</span>
                </Nav.Link>
              </LinkContainer>
              <NavDropdown title={<FaUser />} id="username">
                <LinkContainer to="/login">
                  <NavDropdown.Item>Login</NavDropdown.Item>
                </LinkContainer>
                <LinkContainer to="/register">
                  <NavDropdown.Item>Register</NavDropdown.Item>
                </LinkContainer>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
}

export default Header;
