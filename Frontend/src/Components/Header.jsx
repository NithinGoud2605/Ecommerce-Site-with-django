import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navbar, Nav, Container, NavDropdown, Form, FormControl, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { FaShoppingCart, FaUser, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
// Brand mark used directly as SVG; keeping variable for future theming
const logo = '/vp-mark.svg';
import { CATALOG_SUPABASE_READS } from '../config/flags';
import { useCart } from '../state/cartStore.jsx';
import MiniCartDrawer from './MiniCartDrawer.jsx';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Heart, Globe, Menu, Search, ShoppingBag, User } from 'lucide-react';
import { useWishlist } from '../hooks/useWishlist';
import { formatMoney } from '../utils/money';

function Header() {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const { itemCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'USD');
  useEffect(() => { localStorage.setItem('currency', currency); }, [currency]);
  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();

  // Translucent on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  // Mega-menu accessibility
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const itemRefs = [useRef(null), useRef(null), useRef(null)]; // Women, Men, All
  const closeTimeout = useRef(null);

  function openMenu() {
    clearTimeout(closeTimeout.current);
    setMegaOpen(true);
  }
  function closeMenu() {
    clearTimeout(closeTimeout.current);
    setMegaOpen(false);
  }
  function delayedClose() {
    clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => setMegaOpen(false), 120);
  }

  const onTriggerKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openMenu();
      setTimeout(() => itemRefs[0]?.current?.focus(), 0);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
    }
  };

  const onMenuKeyDown = (e) => {
    const index = itemRefs.findIndex((r) => r.current === document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (index + 1 + itemRefs.length) % itemRefs.length;
      itemRefs[next]?.current?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (index - 1 + itemRefs.length) % itemRefs.length;
      itemRefs[prev]?.current?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      itemRefs[0]?.current?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      itemRefs[itemRefs.length - 1]?.current?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
    }
  };

  const transition = useMemo(() => ({ duration: reduceMotion ? 0 : 0.18, ease: [0.33, 1, 0.68, 1] }), [reduceMotion]);

  return (
    <header className={`lux-header ${scrolled ? 'scrolled' : ''}`}>
      <Navbar bg="transparent" expand="lg" collapseOnSelect className={`header-editorial ${scrolled ? 'navbar-scrolled' : ''}`} fixed="top">
        <Container className="d-flex align-items-center">
          <LinkContainer to="/">
            <Navbar.Brand>
              <img alt="Vyshnavi Pelimelli logo" src="/vp-mark.svg" width="28" height="28" className="me-2"/>
              <span className="fw-semibold" style={{letterSpacing:'.06em'}}>Vyshnavi&nbsp;Pelimelli</span>
            </Navbar.Brand>
          </LinkContainer>
          {import.meta.env.DEV && (
            <div
              aria-label="Supabase Reads Flag"
              className="d-none d-md-flex align-items-center text-nowrap ms-2"
              style={{ fontSize: '0.75rem', opacity: 0.8 }}
            >
              <span
                className="badge bg-secondary"
                title={`VITE_CATALOG_SUPABASE_READS=${String(import.meta?.env?.VITE_CATALOG_SUPABASE_READS ?? '')}`}
              >
                Supabase Reads: {CATALOG_SUPABASE_READS ? 'ON' : 'OFF'}
              </span>
            </div>
          )}
          <Navbar.Toggle aria-controls="basic-navbar-nav" onClick={() => setMobileOpen((v) => !v)} className="ms-auto" />
          <Navbar.Collapse id="basic-navbar-nav" className={`flex-grow-0 ${mobileOpen ? 'show' : ''}`}>
            {/* Center nav (desktop) */}
            <Nav className="mx-auto align-items-center gap-3 d-none d-lg-flex">
              <div
                className="position-relative"
                onMouseEnter={openMenu}
                onMouseLeave={delayedClose}
              >
                <button
                  ref={triggerRef}
                  className="btn btn-link nav-item-custom text-decoration-none"
                  aria-haspopup="true"
                  aria-expanded={megaOpen}
                  aria-controls="mega-shop"
                  onClick={() => (megaOpen ? closeMenu() : openMenu())}
                  onKeyDown={onTriggerKeyDown}
                >
                  Shop
                </button>
                <AnimatePresence>
                  {megaOpen && (
                    <motion.div
                      ref={menuRef}
                      id="mega-shop"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={transition}
                      className="position-absolute start-50 translate-middle-x mt-2 p-3 bg-white shadow rounded-2"
                      style={{ minWidth: 560, zIndex: 1050 }}
                      role="menu"
                      onKeyDown={onMenuKeyDown}
                      onMouseEnter={openMenu}
                      onMouseLeave={delayedClose}
                    >
                      <div className="row g-3">
                        <div className="col-6">
                          <div className="text-uppercase text-muted small mb-2">Shop</div>
                          <LinkContainer to="/shop/women">
                            <Nav.Link ref={itemRefs[0]} tabIndex={0} role="menuitem" className="py-1">Women</Nav.Link>
                          </LinkContainer>
                          <LinkContainer to="/shop/men">
                            <Nav.Link ref={itemRefs[1]} tabIndex={-1} role="menuitem" className="py-1">Men</Nav.Link>
                          </LinkContainer>
                          <LinkContainer to="/shop">
                            <Nav.Link ref={itemRefs[2]} tabIndex={-1} role="menuitem" className="py-1">All Products</Nav.Link>
                          </LinkContainer>
                        </div>
                        <div className="col-6">
                          <div className="text-uppercase text-muted small mb-2">Coming Soon</div>
                          <div className="text-muted">Accessories</div>
                          <div className="text-muted">Homeware</div>
                          <div className="text-muted">Gifts</div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-end mt-2">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closeMenu} aria-label="Close menu">Close</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <LinkContainer to="/wishlist">
                <Nav.Link className="nav-item-custom d-lg-none">Wishlist</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/cart">
                <Nav.Link className="nav-item-custom d-lg-none">Cart</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/collection">
                <Nav.Link className="nav-item-custom">Collections</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/about">
                <Nav.Link className="nav-item-custom">About</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/contact">
                <Nav.Link className="nav-item-custom">Get In Touch</Nav.Link>
              </LinkContainer>
            </Nav>
            {/* Right actions */}
            <Nav className="ms-lg-3 align-items-center">
              <Form className="d-none d-lg-flex me-2" onSubmit={submitHandler} role="search">
                <FormControl
                  type="search"
                  placeholder="Search"
                  className="custom-search-bar"
                  aria-label="Search"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <Button type="submit" variant="outline-light" className="search-button ms-2"><FaSearch /></Button>
              </Form>
            
              <NavDropdown title={currency} id="currency" className="ms-2 nav-item-custom">
                {['USD','EUR','GBP','INR'].map(cur => (
                  <NavDropdown.Item key={cur} active={currency===cur} onClick={() => setCurrency(cur)}>{cur}</NavDropdown.Item>
                ))}
              </NavDropdown>
              <LinkContainer to="/wishlist">
                <Nav.Link className="d-flex align-items-center nav-item-custom">
                  <Heart size={18} className="me-1"/> Wishlist
                  {wishlistItems.length > 0 && <span className="badge bg-secondary ms-1">{wishlistItems.length}</span>}
                </Nav.Link>
              </LinkContainer>
              <Nav.Link onClick={() => setCartOpen(true)} className="d-flex align-items-center nav-item-custom position-relative" role="button" aria-label="Open cart">
                <ShoppingBag size={18} className="me-1" /> Cart
                {itemCount > 0 && (
                  <span className="badge bg-danger ms-1" aria-label={`${itemCount} items in cart`}>{itemCount}</span>
                )}
              </Nav.Link>
              {user ? (
                <NavDropdown title={<span className="d-inline-flex align-items-center"><User size={16} className="me-1" /> {user.email}</span>} id="username" className="ms-2 nav-item-custom">
                  <LinkContainer to="/profile">
                    <NavDropdown.Item>My Profile</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/profile#orders">
                    <NavDropdown.Item>My Orders</NavDropdown.Item>
                  </LinkContainer>
                  <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                </NavDropdown>
              ) : (
                <LinkContainer to="/login">
                  <Nav.Link className="d-flex align-items-center nav-item-custom">
                    <User size={16} className="me-1" /> Sign In
                  </Nav.Link>
                </LinkContainer>
              )}
              {/* Admin menu can be re-wired to Supabase roles in future */}
              {false && (
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
      <MiniCartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); navigate('/checkout'); }} />
    </header>
  );
}

export default Header;
