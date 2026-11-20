import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import HomePage from './pages/HomePage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import CheckoutPage from './components/CheckoutPage.jsx';

/**
 * Cart + auth live here in App.jsx (the src/context folder of the
 * original structure was empty, so the context is kept in one place).
 * The cart count is kept in localStorage so it survives refreshes.
 */
const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export default function App() {
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');

  // refresh the cart badge from the API whenever auth or cart changes
  const refreshCart = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setCartCount(0);
      return;
    }
    try {
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) setCartCount(data.count);
    } catch {
      /* server not running yet - ignore */
    }
  }, []);

  useEffect(() => {
    // restore logged-in user (basic check against /api/auth/me)
    if (!token) {
      setUser(null);
      return;
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setUser(d.user))
      .catch(() => {
        localStorage.removeItem('token');
        setToken('');
        setUser(null);
      });
    refreshCart();
  }, [token, refreshCart]);

  const value = useMemo(
    () => ({
      cartCount,
      setCartCount,
      refreshCart,
      user,
      setUser,
      token,
      setToken: (t) => {
        if (t) localStorage.setItem('token', t);
        else localStorage.removeItem('token');
        setToken(t);
      },
    }),
    [cartCount, user, token, refreshCart]
  );

  return (
    <CartContext.Provider value={value}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route
              path="*"
              element={
                <div className="py-24 text-center">
                  <i className="fa-solid fa-face-frown text-4xl text-slate-400" />
                  <p className="mt-4 text-slate-500">Page not found</p>
                </div>
              }
            />
          </Routes>
        </main>
        <footer className="bg-slate-900 text-slate-300 text-sm">
          <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              <i className="fa-solid fa-bag-shopping mr-2 text-brand-500" />
              ShopEase - basic e-commerce demo
            </p>
            <p>
              Images: Unsplash CDN · Icons: Font Awesome CDN · Built with React + Vite +
              Tailwind
            </p>
          </div>
        </footer>
      </div>
    </CartContext.Provider>
  );
}
