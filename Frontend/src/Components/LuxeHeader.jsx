import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, ShoppingBag, ChevronDown, X, User, LogOut, LayoutDashboard, Heart } from "lucide-react";

export default function LuxeHeader({
  brand = "VYSHNAVI PELIMELLI",
  nav = [
    { to: "/collection", label: "Collections" },
    {
      to: "/shop",
      label: "Shop",
      submenu: [
        { to: "/shop/women", label: "Women" },
        { to: "/shop/men", label: "Men" },
        { to: "/shop", label: "All Products" },
      ],
    },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Get In Touch" },
  ],
}) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);

  const userInfo = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch { return null; }
  }, []);
  const isAdmin = !!(userInfo?.isAdmin || userInfo?.is_staff);

  const logout = () => {
    try { localStorage.removeItem('userInfo'); } catch {}
    navigate('/login');
  };

  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  useEffect(() => {
    const read = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("cartItems") || "[]");
        const count = (stored || []).reduce((n, i) => n + (i.qty || 1), 0);
        setCartCount(count);
      } catch {}
      try {
        const uid = userInfo?.id;
        const wl = uid ? JSON.parse(localStorage.getItem(`wishlist:${uid}`) || '[]') : [];
        setWishCount(Array.isArray(wl) ? wl.length : 0);
      } catch {}
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, [userInfo?.id]);

  const onSubmitSearch = (e) => {
    e.preventDefault();
    const kw = (q || "").trim();
    if (kw) navigate(`/shop?keyword=${encodeURIComponent(kw)}`);
    setSearchOpen(false);
  };

  const DesktopNav = useMemo(
    () => (
      <nav className="d-none d-md-flex align-items-center justify-content-center gap-3 gap-lg-4">
        {nav.map((item) =>
          item.submenu ? (
            <div key={item.label} className="position-relative group">
              <NavLink
                to={item.to}
                className="text-uppercase text-dark text-opacity-85 small d-inline-flex align-items-center gap-1"
              >
                {item.label}
                <ChevronDown size={14} aria-hidden />
              </NavLink>
              <div className="position-absolute start-50 translate-middle-x pt-3 d-none group-hover-d-block" style={{ top: '100%', zIndex: 2000 }}>
                <div className="bg-white border rounded-3 shadow p-2" style={{ minWidth: 260 }}>
                  <ul className="list-unstyled mb-0">
                    {item.submenu.map((sub) => (
                      <li key={sub.label}>
                        <Link to={sub.to} className="d-block rounded-2 px-3 py-2 small text-dark text-decoration-none hover-bg-light">
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <NavLink
              key={item.label}
              to={item.to}
              className="text-uppercase text-dark text-opacity-85 small text-decoration-none"
            >
              {item.label}
            </NavLink>
          )
        )}
      </nav>
    ),
    [nav]
  );

  return (
    <header className="sticky top-0 bg-white bg-opacity-85 backdrop-blur border-bottom" style={{ borderColor: 'var(--line)', zIndex: 10000, position: 'sticky' }}>
      <div className="container-max" style={{ overflow: 'visible', position: 'relative', zIndex: 10000 }}>
        <div className="d-flex align-items-center justify-content-between" style={{ height: '4rem', overflow: 'visible', position: 'relative', zIndex: 10000 }}>
          <Link to="/" className="text-dark text-decoration-none" aria-label="Go to homepage">
            <span className="fw-semibold" style={{ letterSpacing: '0.28em' }}>{brand}</span>
          </Link>

          {DesktopNav}

          <div className="d-flex align-items-center gap-2 gap-md-3">

            <Link to="/wishlist" aria-label={`Wishlist${wishCount ? ` with ${wishCount} items` : ''}`} className="btn btn-sm btn-light border position-relative">
              <Heart size={16} />
              {wishCount > 0 && (
                <span className="position-absolute translate-middle badge rounded-pill bg-dark" style={{ top: 0, right: 0 }}>
                  {wishCount}
                </span>
              )}
            </Link>

            {!userInfo ? (
              <Link to="/login" aria-label="Account" className="btn btn-sm btn-light border">
                <User size={16} />
              </Link>
            ) : (
              <div className="position-relative">
                <button className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1" onClick={()=>setAccountOpen((v)=>!v)} aria-haspopup="menu" aria-expanded={accountOpen}>
                  <User size={16} />
                  <ChevronDown size={14} />
                </button>
                {accountOpen && (
                  <div className="position-absolute end-0 mt-2 bg-white border rounded-3 shadow p-2" style={{ minWidth: 200 }} role="menu">
                    <Link to="/profile" className="d-block rounded px-3 py-2 text-decoration-none text-dark" onMouseDown={(e)=>{ e.preventDefault(); setAccountOpen(false); navigate('/profile'); }}>Profile</Link>
                    {isAdmin && (
                      <>
                        <div className="dropdown-divider" />
                        <Link to="/admin" className="d-block rounded px-3 py-2 text-decoration-none text-dark" onClick={()=>setAccountOpen(false)}>
                          <span className="me-2"><LayoutDashboard size={14} /></span> Admin Dashboard
                        </Link>
                      </>
                    )}
                    <button className="btn btn-link text-decoration-none text-dark d-block w-100 text-start px-3 py-2" onClick={logout}>
                      <span className="me-2"><LogOut size={14} /></span> Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            <Link to="/cart" aria-label={`Cart with ${cartCount} items`} className="btn btn-sm btn-light border position-relative">
              <ShoppingBag size={16} />
              {cartCount > 0 && (
                <span className="position-absolute translate-middle badge rounded-pill bg-dark" style={{ top: 0, right: 0 }}>
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              className="btn btn-sm btn-light border d-md-none"
              aria-label="Menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="position-absolute start-0 end-0 top-100 border-bottom bg-white bg-opacity-95" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="container-max py-2 px-3 px-md-4">
            <form onSubmit={onSubmitSearch} className="d-flex align-items-center gap-2">
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
                placeholder="Search products…"
                className="form-control form-control-sm"
                aria-label="Search products"
              />
              <button className="btn btn-dark btn-sm" aria-label="Submit search">Search</button>
            </form>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div role="dialog" aria-modal="true" className="position-fixed top-0 bottom-0 start-0 end-0 d-md-none" style={{ zIndex: 60 }}>
          <div className="position-absolute top-0 bottom-0 start-0 end-0 bg-dark bg-opacity-40" onClick={() => setMobileOpen(false)} />
          <div className="position-absolute top-0 bottom-0 end-0 bg-white shadow" style={{ width: '86%', maxWidth: 360 }}>
            <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
              <span className="fw-semibold" style={{ letterSpacing: '0.22em' }}>{brand}</span>
              <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="btn btn-sm btn-light">
                <X size={16} />
              </button>
            </div>
            <div className="p-2">
              <form
                onSubmit={(e) => { onSubmitSearch(e); setMobileOpen(false); }}
                className="d-flex align-items-center gap-2 mb-2 px-2"
              >
                <input type="search" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search products…" className="form-control form-control-sm" />
                <button className="btn btn-dark btn-sm">Go</button>
              </form>

              {!userInfo ? (
                <div className="d-flex gap-2 px-2 mb-2">
                  <Link to="/login" className="btn btn-outline-dark btn-sm" onClick={() => setMobileOpen(false)}>Sign in</Link>
                  <Link to="/register" className="btn btn-light btn-sm" onClick={() => setMobileOpen(false)}>Register</Link>
                </div>
              ) : (
                <div className="d-grid gap-2 px-2 mb-2">
                  <Link to="/profile" className="btn btn-light btn-sm" onClick={() => setMobileOpen(false)}>Profile</Link>
                  {isAdmin && <Link to="/admin" className="btn btn-outline-dark btn-sm" onClick={() => setMobileOpen(false)}>Admin Dashboard</Link>}
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => { setMobileOpen(false); logout(); }}>Logout</button>
                </div>
              )}

              <div className="d-grid gap-2 px-2 mb-2">
                <Link to="/wishlist" className="btn btn-outline-dark btn-sm" onClick={() => setMobileOpen(false)}>
                  <span className="me-2"><Heart size={14} /></span> Wishlist {wishCount > 0 ? `(${wishCount})` : ''}
                </Link>
              </div>

              <ul className="list-unstyled">
                {nav.map((item) => (
                  <li key={item.label} className="px-2">
                    {item.submenu ? (
                      <details>
                        <summary className="d-flex align-items-center justify-content-between px-2 py-2 text-uppercase small">
                          {item.label}
                          <ChevronDown size={16} />
                        </summary>
                        <ul className="list-unstyled ps-2">
                          {item.submenu.map((s) => (
                            <li key={s.label}>
                              <Link to={s.to} className="d-block rounded px-2 py-2 text-decoration-none text-dark" onClick={() => setMobileOpen(false)}>
                                {s.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : (
                      <Link to={item.to} className="d-block rounded px-2 py-2 text-uppercase small text-decoration-none text-dark" onClick={() => setMobileOpen(false)}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


