import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../App.jsx';
import api from '../services/axios.js';

/**
 * One product card - the image comes from an external CDN link
 * (Unsplash) stored in the database, so no local assets are needed.
 */
export default function ProductCard({ product }) {
  const { refreshCart } = useCart();
  const [added, setAdded] = useState(false);

  const price = product.effective_price ?? product.discount_price ?? product.price;
  const hasDiscount = Number(product.discount_price) > 0;

  const addToCart = async () => {
    if (!localStorage.getItem('token')) {
      window.dispatchEvent(new Event('open-auth')); // ask Navbar to open the login modal
      return;
    }
    try {
      await api.post('/cart', { productId: product.id, quantity: 1 });
      refreshCart();
      setAdded(true);
      setTimeout(() => setAdded(false), 1200);
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not add to cart');
    }
  };

  return (
    <div className="card group">
      <Link to={`/shop?q=${encodeURIComponent(product.name)}`} className="block">
        <div className="aspect-square overflow-hidden bg-slate-100">
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wide">
          {product.category_name || 'Shop'}
        </p>
        <h3 className="font-medium text-slate-900 mt-1 truncate">{product.name}</h3>

        <div className="mt-1 text-amber-500 text-xs">
          {Array.from({ length: 5 }, (_, i) => (
            <i
              key={i}
              className={
                i < Math.round(Number(product.rating) || 0)
                  ? 'fa-solid fa-star'
                  : 'fa-regular fa-star'
              }
            />
          ))}
          <span className="text-slate-400 ml-1">({Number(product.rating) || 0})</span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="font-semibold text-slate-900">${Number(price).toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-sm text-slate-400 line-through">
              ${Number(product.price).toFixed(2)}
            </span>
          )}
        </div>

        <button onClick={addToCart} className="btn-primary w-full mt-3 text-sm">
          {added ? (
            <>
              <i className="fa-solid fa-check mr-1" /> Added!
            </>
          ) : (
            <>
              <i className="fa-solid fa-cart-plus mr-1" /> Add to cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
