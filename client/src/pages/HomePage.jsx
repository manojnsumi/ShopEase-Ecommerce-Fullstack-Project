import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import api from '../services/axios.js';

/**
 * Home page: hero banner, category strip (Font Awesome icons
 * come from the CDN link in index.html) and featured products.
 */
export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/categories'),
      api.get('/products?limit=8'),
      api.get('/coupons'),
    ])
      .then(([catRes, prodRes, coupRes]) => {
        setCategories(catRes.data.categories || []);
        setFeatured(prodRes.data.products || []);
        setCoupons(coupRes.data.coupons || []);
      })
      .catch(() => {
        /* server not running - page still renders */
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen label="Loading the store..." />;

  return (
    <div>
      {/* hero */}
      <section className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <p className="inline-block bg-white/15 rounded-full px-4 py-1 text-sm mb-4">
            <i className="fa-solid fa-tags mr-1" /> Free shipping on orders over $50
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Everything you need,
            <br /> one shop away
          </h1>
          <p className="mt-4 text-white/80 max-w-xl mx-auto">
            Electronics, fashion, home and more - with discounts you can actually see.
          </p>
          <Link
            to="/shop"
            className="inline-block mt-8 bg-white text-brand-700 font-semibold rounded-xl px-8 py-3 hover:bg-brand-50 transition-colors"
          >
            <i className="fa-solid fa-store mr-2" /> Start shopping
          </Link>
        </div>
      </section>

      {/* coupons */}
      {coupons.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 -mt-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {coupons.map((c) => (
              <span
                key={c.code}
                className="bg-amber-100 text-amber-800 text-sm font-medium rounded-full px-4 py-2"
              >
                <i className="fa-solid fa-ticket mr-1" /> {c.code} - {c.discount_percent}% off
              </span>
            ))}
          </div>
        </section>
      )}

      {/* categories */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold mb-6">Shop by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/shop?category=${c.slug}`}
              className="card p-5 text-center hover:-translate-y-1 transition-transform"
            >
              <i className={`fa-solid ${c.icon} text-2xl text-brand-600`} />
              <p className="mt-2 font-medium text-sm">{c.name}</p>
              <p className="text-xs text-slate-400">{c.product_count} items</p>
            </Link>
          ))}
        </div>
      </section>

      {/* featured products */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Featured products</h2>
          <Link to="/shop" className="text-brand-600 text-sm font-medium hover:underline">
            View all <i className="fa-solid fa-arrow-right ml-1 text-xs" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
