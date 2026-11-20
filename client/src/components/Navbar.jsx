import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../App.jsx';
import api, { getErrorMessage } from '../services/axios.js';

/**
 * Top navigation + basic login / register modal.
 * (The structure has no separate Login page, so the forms
 * live inside the Navbar component.)
 */
export default function Navbar() {
  const { cartCount, user, setUser, setToken, refreshCart } = useCart();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    const open = () => setShowAuth(true);
    window.addEventListener('open-auth', open);
    return () => window.removeEventListener('open-auth', open);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'register') {
        await api.post('/auth/register', form);
        setMode('login');
        setError('Account created - please log in');
        return;
      }
      const { data } = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      });
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        setShowAuth(false);
        refreshCart();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    setCartCount(0);
    navigate('/');
  };

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/shop?q=${encodeURIComponent(search)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-slate-900">
            <i className="fa-solid fa-bag-shopping text-brand-600 text-xl" />
            Shop<span className="text-brand-600">Ease</span>
          </Link>

          <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-md relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="input pl-9"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          </form>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <Link to="/shop" className="text-sm font-medium hover:text-brand-600">
              <i className="fa-solid fa-store mr-1" /> Shop
            </Link>

            <Link
              to="/checkout"
              className="relative text-slate-700 hover:text-brand-600"
              aria-label="Cart"
            >
              <i className="fa-solid fa-cart-shopping text-lg" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-600 text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 grid place-items-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-sm">
                  <i className="fa-solid fa-user mr-1 text-brand-600" />
                  {user.name}
                </span>
                <button onClick={logout} className="text-sm text-slate-500 hover:text-red-500">
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} className="btn-primary text-sm">
                <i className="fa-solid fa-right-to-bracket mr-1" /> Login
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* ---------- login / register modal ---------- */}
      {showAuth && (
        <div
          className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4"
          onClick={() => setShowAuth(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <button
                onClick={() => setShowAuth(false)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              {mode === 'register' && (
                <input
                  className="input"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              )}
              <input
                className="input"
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                className="input"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" className="btn-primary w-full">
                {mode === 'login' ? 'Log in' : 'Sign up'}
              </button>
            </form>

            <p className="mt-4 text-sm text-slate-500 text-center">
              {mode === 'login' ? (
                <>
                  No account?{' '}
                  <button
                    className="text-brand-600 font-medium"
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button
                    className="text-brand-600 font-medium"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                  >
                    Log in
                  </button>
                </>
              )}
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 leading-relaxed">
              <b>Demo accounts</b>
              <br />
              Customer: john@email.com / User@123
              <br />
              Admin panel: admin@shop.com / Admin@123
            </div>
          </div>
        </div>
      )}
    </>
  );
}
