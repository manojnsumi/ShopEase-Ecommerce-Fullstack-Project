import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import api from '../services/axios.js';

/**
 * Shop page: category chips, sorting and pagination -
 * all handled by simple query params on GET /api/products.
 */
export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');

  const category = searchParams.get('category') || '';
  const q = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || '';
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (q) return; // keyword search is handled by the /api/search effect below
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 12 });
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);

    api.get(`/products?${params.toString()}`)
      .then((res) => {
        setProducts(res.data.products || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, sort, page]);

  // keyword search goes through the dedicated /api/search endpoint
  useEffect(() => {
    if (!q) {
      return;
    }
    setLoading(true);
    api.get(`/search?q=${encodeURIComponent(q)}`)
      .then((res) => {
        setProducts(res.data.products || []);
        setTotal((res.data.products || []).length);
        setPages(1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setParam('q', search);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <h1 className="text-2xl font-bold">
          <i className="fa-solid fa-store mr-2 text-brand-600" /> Shop
          {q && <span className="text-slate-400 text-lg font-normal"> - results for "{q}"</span>}
        </h1>
        <form onSubmit={submitSearch} className="flex gap-2">
          <input
            className="input"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-primary">
            <i className="fa-solid fa-magnifying-glass" />
          </button>
        </form>
      </div>

      {/* filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setParam('category', '')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            !category ? 'bg-brand-600 text-white' : 'bg-white border border-slate-300'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setParam('category', c.slug)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              category === c.slug ? 'bg-brand-600 text-white' : 'bg-white border border-slate-300'
            }`}
          >
            <i className={`fa-solid ${c.icon} mr-1 text-xs`} /> {c.name}
          </button>
        ))}

        <select
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
          className="input w-auto ml-auto"
        >
          <option value="">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {loading ? (
        <LoadingScreen label="Loading products..." />
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <i className="fa-solid fa-box-open text-4xl text-slate-300" />
          <p className="mt-3 text-slate-500">No products found.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-400 mt-6">{total} products</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {/* pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setParam('page', i + 1)}
                  className={`h-9 w-9 rounded-lg text-sm font-medium ${
                    page === i + 1 ? 'bg-brand-600 text-white' : 'bg-white border border-slate-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
