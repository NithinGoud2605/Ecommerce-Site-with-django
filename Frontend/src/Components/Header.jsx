import React, { useState } from 'react';
import { Navbar, Nav, Container, NavDropdown, Form, FormControl, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { FaShoppingCart, FaUser, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logo from '../../public/logo.png';

function Header() {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/?keyword=${keyword}`);
    } else {
      navigate('/');
    }
  };

  return (
    <header>
      <Navbar bg="dark" variant="dark" expand="lg" collapseOnSelect className="custom-navbar">
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand>
              <img
                alt="Logo"
                src={logo}
                width="200"
                height="auto"
                className="d-inline-block align-top logo-padding"
              />
            </Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {/* Add additional Nav links if needed */}
            </Nav>

            {/* Search Bar */}
            <Form className="d-flex me-3 search-form" onSubmit={submitHandler}>
              <FormControl
                type="search"
                placeholder="Search products..."
                className="me-2 custom-search-bar"
                aria-label="Search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Button type="submit" variant="outline-light" className="search-button"><FaSearch /></Button>
            </Form>

            <Nav>
              <LinkContainer to="/cart">
                <Nav.Link className="d-flex align-items-center nav-item-custom">
                  <FaShoppingCart className="me-1" /> Cart
                </Nav.Link>
              </LinkContainer>
              {userInfo ? (
                <NavDropdown title={userInfo.name} id="username" className="ms-2 nav-item-custom">
                  <LinkContainer to="/profile">
                    <NavDropdown.Item>Profile</NavDropdown.Item>
                  </LinkContainer>
                  <NavDropdown.Item onClick={logoutHandler}>Logout</NavDropdown.Item>
                </NavDropdown>
              ) : (
                <LinkContainer to="/login">
                  <Nav.Link className="d-flex align-items-center nav-item-custom">
                    <FaUser className="me-1" /> Sign In
                  </Nav.Link>
                </LinkContainer>
              )}
              {userInfo && userInfo.isAdmin && (
                <NavDropdown title="Admin" id="adminmenu" className="ms-2 nav-item-custom">
                  <LinkContainer to="/admin/userlist">
                    <NavDropdown.Item>Manage Users</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/admin/productlist">
                    <NavDropdown.Item>Manage Products</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/admin/orderlist">
                    <NavDropdown.Item>Manage Orders</NavDropdown.Item>
                  </LinkContainer>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>


    </header>
  );
}

export default Header;
