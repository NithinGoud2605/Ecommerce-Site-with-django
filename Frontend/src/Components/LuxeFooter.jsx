import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Twitter, ArrowRight } from "lucide-react";

// Optional: pass onSubscribe(email) to integrate with your backend/Supabase.
export default function LuxeFooter({
  brand = "VYSHNAVI PELIMELLI",
  year = new Date().getFullYear(),
  onSubscribe,
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ state: "idle", msg: "" });

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus({ state: "loading", msg: "" });
    try {
      if (onSubscribe) {
        await onSubscribe(email);
      } else {
        // Fallback stub: try a conventional endpoint; ignore errors for UX.
        await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      }
      setStatus({ state: "success", msg: "Thanks! You’re on the list." });
      setEmail("");
    } catch {
      setStatus({ state: "error", msg: "Couldn’t subscribe right now." });
    }
  };

  return (
    <footer className="mt-16 border-top" style={{ borderColor: 'var(--line)', background: 'rgba(248,248,248,0.8)' }}>
      {/* Newsletter */}
      <section className="full-bleed">
        <div className="container-max px-4 md:px-6">
          <div className="d-flex flex-column align-items-start gap-3 gap-md-4 py-4 py-md-5 flex-md-row align-items-md-center justify-content-md-between">
            <div>
              <div className="text-uppercase" style={{ letterSpacing: '0.14em', fontSize: 12, color: 'var(--ink)' }}>Join the list</div>
              <h3 className="mt-2" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.35rem,2.5vw,1.75rem)', lineHeight: 1.1 }}>
                New drops, runway notes, private previews.
              </h3>
            </div>

            <form onSubmit={submit} className="w-100" style={{ maxWidth: 520 }}>
              <div className="position-relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  aria-label="Email address"
                  className="form-control"
                  style={{ height: 48, paddingRight: 48, borderRadius: 12, borderColor: 'var(--line)' }}
                />
                <button
                  aria-label="Subscribe"
                  className="position-absolute d-inline-flex align-items-center justify-content-center text-white"
                  style={{ right: 6, top: 6, width: 36, height: 36, borderRadius: 8, background: '#000' }}
                  disabled={status.state === 'loading'}
                >
                  <ArrowRight size={18} />
                </button>
              </div>
              {status.msg && (
                <p className="mt-2 small" style={{ color: status.state === 'success' ? '#059669' : status.state === 'error' ? '#dc2626' : '#6b7280' }}>
                  {status.msg}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <section className="full-bleed">
        <div className="container-max px-4 md:px-6 py-5 py-md-6">
          <div className="row g-4 g-lg-5">
            {/* Brand blurb */}
            <div className="col-12 col-md-4">
              <Link to="/" className="text-decoration-none" style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.26em', color: '#000' }}>
                {brand}
              </Link>
              <p className="mt-3 small text-muted" style={{ maxWidth: 360 }}>
                Architectural tailoring and hand embellishment from our atelier. Limited quantities. Responsible materials.
              </p>

              {/* Social */}
              <div className="mt-3 d-flex align-items-center gap-2">
                {[
                  { Icon: Instagram, label: 'Instagram', href: 'https://instagram.com/' },
                  { Icon: Facebook, label: 'Facebook', href: 'https://facebook.com/' },
                  { Icon: Twitter, label: 'Twitter', href: 'https://twitter.com/' },
                  { Icon: Youtube, label: 'YouTube', href: 'https://youtube.com/' },
                ].map(({ Icon, label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                     className="d-inline-flex align-items-center justify-content-center"
                     style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--line)', background: '#fff' }}>
                    <Icon size={18} color="#111" />
                  </a>
                ))}
              </div>
            </div>

            {/* Columns */}
            <div className="col-6 col-md-2">
              <FooterCol title="Shop">
                <FooterLink to="/shop">All Products</FooterLink>
                <FooterLink to="/shop?keyword=new">New Arrivals</FooterLink>
                <FooterLink to="/shop?sort=rating_desc">Best Sellers</FooterLink>
                <FooterLink to="/shop/women">Women</FooterLink>
                <FooterLink to="/shop/men">Men</FooterLink>
              </FooterCol>
            </div>
            <div className="col-6 col-md-2">
              <FooterCol title="About">
                <FooterLink to="/about">Our Story</FooterLink>
                <FooterLink to="/collection">Collections</FooterLink>
                <FooterLink to="/featured">Featured</FooterLink>
                <FooterLink to="/contact">Get in Touch</FooterLink>
              </FooterCol>
            </div>
            <div className="col-6 col-md-2">
              <FooterCol title="Support">
                <FooterLink to="/pages/shipping-returns">Shipping & Returns</FooterLink>
                <FooterLink to="/pages/size-guide">Size Guide</FooterLink>
                <FooterLink to="/pages/faq">FAQ</FooterLink>
                <FooterLink to="/contact">Contact</FooterLink>
              </FooterCol>
            </div>
            <div className="col-6 col-md-2">
              <FooterCol title="Legal">
                <FooterLink to="/pages/terms">Terms of Service</FooterLink>
                <FooterLink to="/pages/privacy">Privacy Policy</FooterLink>
                <FooterLink to="/pages/cookies">Cookie Policy</FooterLink>
              </FooterCol>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-4 pt-3 d-flex flex-column flex-md-row align-items-center justify-content-between border-top" style={{ borderColor: 'var(--line)', color: '#6b7280', fontSize: 14 }}>
            <div>© {year} {brand}. All rights reserved.</div>
            <div className="d-flex align-items-center gap-3 mt-2 mt-md-0">
              <span className="text-uppercase" style={{ letterSpacing: '0.12em' }}>EN / USD</span>
              <a href="/sitemap.xml" className="text-decoration-none">Sitemap</a>
              <a href="/pages/accessibility" className="text-decoration-none">Accessibility</a>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn btn-link p-0 text-decoration-none">Back to top</button>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}

function FooterCol({ title, children }) {
  return (
    <div>
      <h4 className="mb-2 text-uppercase" style={{ letterSpacing: '0.14em', fontSize: 12, color: 'var(--ink)' }}>{title}</h4>
      <ul className="list-unstyled mb-0 d-grid gap-2">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }) {
  const isExternal = typeof to === 'string' && /^https?:\/\//.test(to);
  const cls = 'text-decoration-none';
  return isExternal ? (
    <a href={to} className={cls} style={{ color: '#6b7280' }}>{children}</a>
  ) : (
    <Link to={to} className={cls} style={{ color: '#6b7280' }}>{children}</Link>
  );
}


