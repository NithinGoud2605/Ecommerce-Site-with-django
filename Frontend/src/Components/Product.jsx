// Product.js
import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Rating from './Rating';
import { productHeroUrl } from '../lib/storage';
import { useCart } from '../state/cartStore.jsx';
import { useImpression } from '../hooks/useImpression';
import { track } from '../lib/telemetry';
import { useWishlist } from '../hooks/useWishlist';
import { Heart } from 'lucide-react';

function Product({ product, enableQuickAdd = false }) {
  const { addItem } = useCart();
  const imageUrl = productHeroUrl(product);
  const secondaryUrl = Array.isArray(product?.media) && product.media.length > 1 ? (product.media[1]?.url || null) : null;
  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!enableQuickAdd) return;
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    let variantToAdd = null;
    if (variants.length) {
      variantToAdd = variants.find((v) => (v?.stock || 0) > 0) || variants[0];
    } else {
      const price = typeof product?.price === 'number' ? Math.round(product.price * 100) : 0;
      variantToAdd = {
        id: product?._id || product?.id || `p_${product?.name || 'item'}`,
        productId: product?._id || product?.id || null,
        name: product?.name || 'Item',
        price_cents: price,
        currency: 'USD',
        image_path: product?.image || imageUrl || null,
      };
    }
    addItem({
      id: variantToAdd?.id,
      variantId: variantToAdd?.id,
      productId: variantToAdd?.productId ?? (product?._id || product?.id || null),
      name: product?.name || variantToAdd?.name || 'Item',
      price_cents: variantToAdd?.price_cents || 0,
      currency: variantToAdd?.currency || 'USD',
      image_path: variantToAdd?.image_path || imageUrl || null,
    }, 1);
  };

  const impRef = useImpression('product_impression', { id: product?._id || product?.id });
  const { user } = { user: null };
  const { has, toggle } = useWishlist();
  const wished = has(product?._id || product?.id);
  const productId = product?._id || product?.id;

  return (
    <Card ref={impRef} className="my-3 p-3 rounded product-card" style={{ borderRadius: 16, contentVisibility: 'auto', containIntrinsicSize: '400px 500px' }}>
      <Link to={`/product/${productId}`} onClick={() => { track('product_click', { id: productId }); }}>
        <div style={{ position: 'relative', width: '100%', paddingTop: '125%' /* 4:5 aspect ratio */ }}>
          <picture>
            <source srcSet={imageUrl} type="image/avif" />
            <source srcSet={imageUrl} type="image/webp" />
            <img
              src={imageUrl}
              loading="lazy"
              decoding="async"
              alt={product.name}
              sizes="(min-width: 1200px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="product-image"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 240ms cubic-bezier(0.33,1,0.68,1)' }}
            />
          </picture>
          {secondaryUrl && (
             <picture>
               <source srcSet={secondaryUrl} type="image/avif" />
               <source srcSet={secondaryUrl} type="image/webp" />
              <img
                src={secondaryUrl}
                alt=""
                aria-hidden="true"
                 sizes="(min-width: 1200px) 25vw, (min-width: 768px) 33vw, 50vw"
                style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0, transition:'opacity 200ms cubic-bezier(0.33,1,0.68,1)' }}
              />
            </picture>
          )}
          <div className="d-none d-md-block position-absolute" style={{ right: 8, bottom: 8 }}>
            {enableQuickAdd && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={(e)=>{ handleQuickAdd(e); track('quick_add', { id: productId }); }}
              >
                Quick Add
              </button>
            )}
          </div>
          <button
            type="button"
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            className="btn btn-sm position-absolute"
            style={{ left: 8, top: 8, background:'rgba(255,255,255,0.9)' }}
            onClick={(e)=>{ e.preventDefault(); toggle(productId); }}
          >
            <Heart size={16} color={wished ? '#C8A96A' : '#222'} fill={wished ? '#C8A96A' : 'none'} />
          </button>
          <style>{`
            .product-card:hover img:first-child { transform: scale(1.04); }
            .product-card:hover img + img { opacity: 1; }
            .product-card:focus-within { outline: 2px solid #222; outline-offset: 2px; }
          `}</style>
        </div>
      </Link>

      <Card.Body>
        <Link to={`/product/${productId}`} className="product-link">
          <Card.Title as="div">
            <strong>{product.name}</strong>
          </Card.Title>
        </Link>

        <Card.Text as="div">
          <Rating value={product.rating} text={`${product.numReviews} reviews`} />
        </Card.Text>

        <Card.Text as="div" className="product-price" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontVariantCaps: 'all-small-caps', opacity: 0.8, marginRight: 4 }}>USD</span>
          <span style={{ fontWeight: 600 }}>${product.price}</span>
        </Card.Text>
      </Card.Body>
    </Card>
  );
}

export default Product;
