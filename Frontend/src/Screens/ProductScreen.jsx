import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Row, Col, ListGroup, Button, Card, Form, Alert, Accordion, Badge } from 'react-bootstrap';
import { Info, Package, Truck, RotateCcw } from 'lucide-react';
import { listProducts } from '../lib/catalogClient';
import axiosInstance from '../axiosInstance';
import Rating from '../Components/Rating';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import Gallery from '../Components/Gallery';
import VariantPicker from '../Components/VariantPicker';
import SizeGuideModal from '../Components/SizeGuideModal';
import AddToCartButton from '../Components/AddToCartButton';
import Product from '../Components/Product';
import { getProductBySlug } from '../lib/catalogClient';
import { CATALOG_SUPABASE_READS } from '../config/flags';
import { useCart } from '../state/cartStore.jsx';
import { setMeta, updateMeta, preloadImage } from '../lib/seo.js';

// SEO helper for structured data
function injectJsonLd(id, json) {
  const tagId = `jsonld-${id}`;
  let el = document.getElementById(tagId);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = tagId;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(json);
}

// Mobile sticky ATC bar component
function MobileATCBar({ price, disabled, onAdd }) {
  return (
    <div className="d-md-none" style={{ position:'sticky', bottom:0, zIndex: 10 }}>
      <div style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'saturate(140%) blur(8px)',
        borderTop: '1px solid rgba(0,0,0,0.06)'
      }} className="p-2 d-flex align-items-center gap-2">
        <div className="ms-1">
          <div className="small text-muted">Total</div>
          <div className="fw-semibold">{price || '-'}</div>
        </div>
        <Button
          className="ms-auto px-4"
          disabled={disabled}
          onClick={onAdd}
          variant="dark"
        >
          Add to Bag
        </Button>
      </div>
    </div>
  );
}

// Skeleton component for loading states
const Skeleton = ({ h=16, w='100%', className='' }) => (
  <div className={className} style={{ height:h, width:w, borderRadius:8, background:'linear-gradient(90deg,#eee,#f5f5f5,#eee)', backgroundSize:'200% 100%', animation:'shimmer 1.2s infinite' }} />
);

function ProductScreen() {
  const { id: routeParam } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(''); // 'supabase' | 'django'

  // Unified product shape
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [media, setMedia] = useState([]);

  // PDP interactions
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState({ variantId: null, size: null, color: null });
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [related, setRelated] = useState([]);

  // Reviews (Django only)
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loadingReview, setLoadingReview] = useState(false);
  const [errorReview, setErrorReview] = useState(null);
  const [successReview, setSuccessReview] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const { addItem } = useCart();

  // Derived values must be declared before any effects that depend on them
  const selectedVariant = useMemo(
    () => (variants || []).find((v) => v?.id === selected.variantId) || null,
    [variants, selected.variantId]
  );

  const primaryPriceCents = useMemo(() => {
    if (Array.isArray(variants) && variants.length > 0) {
      const prices = variants
        .map((v) => (typeof v?.price_cents === 'number' ? v.price_cents : null))
        .filter((n) => typeof n === 'number');
      if (prices.length) return Math.min(...prices);
    }
    // Django fallback price
    const price = typeof product?.price === 'number' ? product.price : null;
    return price != null ? Math.round(price * 100) : null;
  }, [variants, product]);

  const primaryCurrency = useMemo(() => {
    const v = (variants || []).find((x) => typeof x?.price_cents === 'number' && x?.currency);
    return v?.currency || 'USD';
  }, [variants]);

  const stock = useMemo(() => {
    if (selectedVariant) return selectedVariant.stock || 0;
    if (Array.isArray(variants) && variants.length > 0) {
      return variants.reduce((sum, v) => sum + (v?.stock || 0), 0);
    }
    return typeof product?.countInStock === 'number' ? product.countInStock : 0;
  }, [selectedVariant, variants, product]);

  // Hydrate selected options from URL on first load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('variant');
    const size = params.get('size');
    const color = params.get('color');
    if (v || size || color) {
      setSelected(cur => ({ ...cur, variantId: v || cur.variantId, size: size || cur.size, color: color || cur.color }));
    }
  }, []);

  // Persist selected options in URL for shareable state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selected?.variantId) params.set('variant', String(selected.variantId));
    if (selected?.size) params.set('size', String(selected.size));
    if (selected?.color) params.set('color', String(selected.color));
    // don't navigate; just replace
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [selected]);

  useEffect(() => {
    let aborted = false;
    async function fetchSupabase() {
      const { product: p, variants: v, media: m, error: e } = await getProductBySlug(routeParam);
      if (aborted) return;
      if (e || !p) throw new Error(e || 'not_found');
      setProduct(p);
      setVariants(Array.isArray(v) ? v : []);
      setMedia(Array.isArray(m) ? m : []);
      setSource('supabase');
      
      // Track PDP view
      try {
        window.dispatchEvent(new CustomEvent('telemetry', { detail: { type: 'pdp_view', id: p.id || p._id, name: p.name } }));
      } catch {}
    }
    async function fetchDjango() {
      if (!/^\d+$/.test(String(routeParam))) throw new Error('non_numeric_id');
      const { data } = await axiosInstance.get(`/api/products/${routeParam}/`);
      if (aborted) return;
      const p = data || {};
      setProduct(p);
      setVariants([]);
      setMedia(p?.image ? [{ id: null, url: p.image, alt: p.name, role: 'hero', position: 0 }] : []);
      setSource('django');
      
      // Track PDP view
      try {
        window.dispatchEvent(new CustomEvent('telemetry', { detail: { type: 'pdp_view', id: p._id, name: p.name } }));
      } catch {}
    }

    async function run() {
      try {
        setLoading(true);
        setError(null);
        if (CATALOG_SUPABASE_READS) {
          try {
            await fetchSupabase();
          } catch (e) {
            await fetchDjango();
          }
        } else {
          await fetchDjango();
        }
      } catch (err) {
        setError(err?.response?.data?.detail || err?.message || 'Error loading product');
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    run();
    return () => {
      aborted = true;
    };
    // Re-fetch when route changes or after successful review (Django)
  }, [routeParam, successReview]);

  useEffect(() => {
    // fetch related products by gender or fallback to newest
    (async () => {
      const g = product?.gender || null;
      const res = await listProducts({ gender: g || undefined, sort: 'newest', page: 1, pageSize: 8 });
      setRelated(Array.isArray(res?.items) ? res.items : []);
    })();
  }, [product?.gender]);

  useEffect(() => {
    if (!product) return;
    const heroUrl = media?.[0]?.url || product?.image || null;
    const brand = product?.brand || product?.vendor || product?.manufacturer || '';
    const name = product?.name || 'Product';
    const title = brand ? `${name} by ${brand} – Vyshnavi Pelimelli` : `${name} – Vyshnavi Pelimelli`;
    const desc = product?.description || 'Discover unique handmade products.';
    setMeta({ title, description: desc, image: heroUrl, type: 'product' });
    if (heroUrl) preloadImage(heroUrl);
  }, [product, media]);

  // Product structured data for SEO rich results
  useEffect(() => {
    if (!product) return;
    const name = product?.name || 'Product';
    const imgList = (media || []).map(m => m.url).filter(Boolean).slice(0, 8);
    const price = primaryPriceCents != null ? (primaryPriceCents / 100).toFixed(2) : undefined;
    const brand = product?.brand || product?.vendor || 'Vyshnavi Pelimelli';
    const availability = stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

    if (price) {
      injectJsonLd(`pdp-${product.id || product._id || 'x'}`, {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        image: imgList.length ? imgList : (product?.image ? [product.image] : []),
        description: product?.description || '',
        brand: { '@type': 'Brand', name: brand },
        sku: (variants?.[0]?.sku || String(product?.id || product?._id || 'sku')),
        offers: {
          '@type': 'Offer',
          priceCurrency: primaryCurrency || 'USD',
          price,
          availability,
          url: window.location.href,
          itemCondition: 'https://schema.org/NewCondition'
        }
      });
    }
  }, [product, media, primaryPriceCents, primaryCurrency, stock, variants]);

  useEffect(() => {
    if (!product) return;
    try {
      const key = 'recently_viewed_products';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const entry = { id: product.id || product._id || routeParam, name: product.name, image: media?.[0]?.url || product?.image || null };
      const next = [entry, ...list.filter((e) => (e.id !== entry.id))].slice(0, 10);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  }, [product, media, routeParam]);

  const priceLabel = useMemo(() => {
    if (primaryPriceCents == null) return null;
    const amount = (primaryPriceCents / 100).toFixed(2);
    return `${primaryCurrency} ${amount}`;
  }, [primaryPriceCents, primaryCurrency]);

  const addToCartHandler = () => {
    // Derive a variant/pseudo-variant to add
    let variantToAdd = selectedVariant;
    if (!variantToAdd) {
      // If no variants provided (Django), create pseudo-variant
      const price = typeof product?.price === 'number' ? Math.round(product.price * 100) : 0;
      variantToAdd = {
        id: product?._id || product?.id || routeParam,
        productId: product?._id || product?.id || null,
        name: product?.name || 'Item',
        price_cents: price,
        currency: 'USD',
        image_path: media?.[0]?.url || product?.image || null,
      };
    } else {
      // Enrich with product info
      variantToAdd = {
        ...variantToAdd,
        productId: product?.id || product?._id || null,
        name: product?.name || variantToAdd?.name || 'Item',
        image_path: media?.[0]?.url || product?.image || null,
      };
    }
    setAdding(true);
    addItem({
      id: variantToAdd?.id,
      variantId: variantToAdd?.id,
      productId: variantToAdd?.productId,
      name: variantToAdd?.name,
      price_cents: variantToAdd?.price_cents || 0,
      currency: variantToAdd?.currency || 'USD',
      image_path: variantToAdd?.image_path || null,
    }, qty);
    setTimeout(()=> setAdding(false), 300); // simple visual feedback
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!rating || !String(comment).trim()) {
      setErrorReview('Please add a rating and a short comment.');
      return;
    }
    setLoadingReview(true);
    console.log("User Info:", userInfo); // Log user information

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const response = await axiosInstance.post(`/api/products/${routeParam}/reviews/`, { rating, comment }, config);
      console.log("Review Submission Response:", response); // Log successful response

      setSuccessReview(true);
      setRating(0);
      setComment('');
      setLoadingReview(false);
    } catch (err) {
      setErrorReview(err.response?.data?.detail || 'Error submitting review');
      console.error("Detailed Error Response:", err.response); // Log detailed error response
      setLoadingReview(false);
    }
  };

  const showReviews = source === 'django';

  return (
    <div>
      <Link to='/' className='btn btn-light my-3'>
        Go Back
      </Link>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : !product ? (
        <Message variant='warning'>Product not found</Message>
      ) : (
        <div>
          {import.meta.env.DEV && (
            <div style={{ fontSize: '0.8rem', opacity: 0.75 }} className='mb-2'>via {source === 'supabase' ? 'Supabase' : 'Django'}</div>
          )}
          <Row>
            <Col md={6}>
              <Gallery media={media} />
            </Col>
            <Col md={3}>
              <ListGroup variant="flush">
                <ListGroup.Item className='border-0'>
                  <h1 className='text-primary mb-1' style={{ fontFamily:'Playfair Display, serif' }}>{product.name}</h1>
                  {priceLabel && <div className='fs-5'>{priceLabel}</div>}
                </ListGroup.Item>
                {typeof product?.rating === 'number' && (
                  <ListGroup.Item className='border-0'>
                    <Rating value={Number(product.rating)} text={`${product.numReviews || 0} reviews`} color={'#f8e825'} />
                  </ListGroup.Item>
                )}
                {stock > 0 && stock < 5 && (
                  <ListGroup.Item className='border-0 p-0 px-2'>
                    <Badge bg="warning" text="dark">Low stock: {stock} left</Badge>
                  </ListGroup.Item>
                )}
                <ListGroup.Item className='border-0'>
                  <div className='d-flex align-items-start gap-2'>
                    <Info size={16} className='mt-1 text-muted' />
                    <div>
                      <div className='fw-semibold mb-1'>Description</div>
                      <div>{product.description}</div>
                      {product.materials && (
                        <div className='mt-2'>
                          <div className='fw-semibold small text-muted'>Made of</div>
                          <div>{product.materials}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
                {Array.isArray(variants) && variants.length > 0 && (
                  <ListGroup.Item className='border-0'>
                    <div className='d-flex justify-content-between align-items-center mb-2'>
                      <span className='fw-semibold'>Options</span>
                      <button type='button' className='btn btn-link p-0' onClick={() => setSizeGuideOpen(true)}>Size guide</button>
                    </div>
                    <VariantPicker variants={variants} onChange={setSelected} />
                  </ListGroup.Item>
                )}
                <ListGroup.Item className='border-0'>
                  <Accordion alwaysOpen>
                    <Accordion.Item eventKey="0">
                      <Accordion.Header><Package size={16} className='me-2'/> Fabric & Care</Accordion.Header>
                      <Accordion.Body>
                        Hand wash with mild detergent. Do not bleach. Lay flat to dry.
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                      <Accordion.Header><Truck size={16} className='me-2'/> Shipping</Accordion.Header>
                      <Accordion.Body>
                        Free standard shipping over $50. Returns accepted within 30 days.
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="2">
                      <Accordion.Header><RotateCcw size={16} className='me-2'/> Returns</Accordion.Header>
                      <Accordion.Body>
                        Return unworn items within 30 days for a full refund.
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
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
                        <strong>{priceLabel || (product?.price != null ? `$${product.price}` : '-')}</strong>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item className='border-0'>
                    <Row>
                      <Col>Status:</Col>
                      <Col>{stock > 0 ? 'In Stock' : 'Out of Stock'}</Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item className='border-0'>
                    <div className='d-flex align-items-center gap-2'>
                      <span className='text-muted'>Share:</span>
                      <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product?.name || '')}`} target='_blank' rel='noreferrer' className='text-decoration-none'>Twitter</a>
                      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target='_blank' rel='noreferrer' className='text-decoration-none'>Facebook</a>
                      <a href={`mailto:?subject=${encodeURIComponent(product?.name || 'Check this out')}&body=${encodeURIComponent(window.location.href)}`} className='text-decoration-none'>Email</a>
                    </div>
                  </ListGroup.Item>
                  {stock > 0 && (
                    <ListGroup.Item className='border-0'>
                      <Row>
                        <Col>Qty</Col>
                        <Col xs='auto' className='my-1'>
                          <Form.Control as="select" value={qty} onChange={(e) => setQty(Number(e.target.value))} className='rounded'>
                            {Array.from({ length: Math.max(1, Math.min(stock, 20)) }).map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </Form.Control>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  )}
                  <ListGroup.Item className='border-0'>
                    <AddToCartButton
                      selectedVariantId={variants.length > 0 ? selected.variantId : 'no-variant'}
                      quantity={qty}
                      disabled={stock <= 0 || (variants.length > 0 && !selected.variantId)}
                      loading={adding}
                      onAdd={() => addToCartHandler()}
                    />
                  </ListGroup.Item>
                </ListGroup>
              </Card>
            </Col>
          </Row>

          {/* Mobile sticky ATC bar */}
          <MobileATCBar
            price={priceLabel || (product?.price != null ? `$${product.price}` : '-')}
            disabled={stock <= 0 || (variants.length > 0 && !selected.variantId)}
            onAdd={addToCartHandler}
          />

          {/* Related products */}
          {Array.isArray(related) && related.length > 0 && (
            <Row className='mt-5'>
              <Col>
                <h4 style={{ fontFamily:'Playfair Display, serif' }}>You may also like</h4>
                <div className='d-flex overflow-auto gap-3 pb-2' style={{ contentVisibility:'auto', containIntrinsicSize:'1000px 320px' }}>
                  {related.map((p) => (
                    <div key={p.id || p._id} style={{ minWidth: 260 }}>
                      {/* Normalize id for Product card */}
                      <Product product={{ ...p, _id: p._id ?? p.id }} enableQuickAdd={true} />
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
          )}

          {showReviews && (
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
                    {successReview && <Message variant='success' aria-live="polite">Review submitted successfully!</Message>}
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
          )}

          <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
        </div>
      )}
    </div>
  );
}

export default ProductScreen;
