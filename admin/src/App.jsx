import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardPage from './pages/DashboardPage.jsx';

/**
 * Admin panel entry (basic version):
 * - shows a login screen until an admin logs in
 * - then renders the single DashboardPage from pages/
 *
 * src/package.json and src/vite.config.js from the original
 * structure were moved to the admin/ root because Vite only
 * reads them from there (documented in the README).
 */

// one shared axios instance with the admin token attached
export const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const GlobalStyle = () => (
  <style>{`
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Poppins', system-ui, sans-serif; background: #f1f5f9; color: #1e293b; }
    .admin { display: flex; min-height: 100vh; }
    .sidebar { width: 230px; background: #0f172a; color: #cbd5e1; padding: 24px 16px; flex-shrink: 0; }
    .sidebar .logo { font-weight: 700; color: #fff; font-size: 18px; margin-bottom: 28px; display: flex; gap: 10px; align-items: center; }
    .sidebar .logo span { color: #818cf8; }
    .sidebar a { display: flex; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 10px; color: #cbd5e1; text-decoration: none; font-size: 14px; margin-bottom: 4px; background: transparent; border: 0; width: 100%; cursor: pointer; text-align: left; font-family: inherit; }
    .sidebar a.active, .sidebar a:hover { background: #1e293b; color: #fff; }
    .content { flex: 1; padding: 28px 32px; overflow-x: auto; }
    .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .card { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(15,23,42,.08); }
    .card h3 { margin: 0; font-size: 13px; color: #64748b; font-weight: 500; }
    .card p { margin: 6px 0 0; font-size: 26px; font-weight: 700; }
    .card i { color: #4f46e5; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(15,23,42,.08); font-size: 14px; }
    th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #f1f5f9; }
    th { background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }
    .badge { padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .badge.pending { background: #fef3c7; color: #92400e; }
    .badge.paid, .badge.delivered { background: #dcfce7; color: #166534; }
    .badge.shipped { background: #dbeafe; color: #1e40af; }
    .badge.cancelled { background: #fee2e2; color: #991b1b; }
    .btn { background: #4f46e5; color: #fff; border: 0; padding: 9px 16px; border-radius: 10px; cursor: pointer; font-family: inherit; font-size: 14px; }
    .btn:hover { background: #4338ca; }
    .btn.ghost { background: transparent; color: #4f46e5; border: 1px solid #c7d2fe; }
    .btn.danger { background: #fee2e2; color: #991b1b; }
    input, select, textarea { font-family: inherit; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; background: #fff; width: 100%; }
    input:focus, select:focus { outline: 2px solid #6366f1; }
    .login-wrap { min-height: 100vh; display: grid; place-items: center; background: linear-gradient(135deg, #312e81, #6366f1); padding: 16px; }
    .login-box { background: #fff; padding: 32px; border-radius: 20px; width: 100%; max-width: 380px; box-shadow: 0 20px 50px rgba(0,0,0,.25); }
    .err { color: #dc2626; font-size: 13px; margin: 8px 0; }
    .ok { color: #16a34a; font-size: 13px; margin: 8px 0; }
    .section-title { font-size: 16px; font-weight: 600; margin: 28px 0 12px; display: flex; gap: 8px; align-items: center; }
    .row { display: flex; gap: 10px; flex-wrap: wrap; }
    .row > * { flex: 1 1 160px; }
    @media (max-width: 720px) {
      .admin { flex-direction: column; }
      .sidebar { width: 100%; display: flex; gap: 6px; overflow-x: auto; padding: 12px; }
      .sidebar .logo { display: none; }
      .sidebar a { white-space: nowrap; }
      .content { padding: 16px; }
    }
  `}</style>
);

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [admin, setAdmin] = useState(null);
  const [form, setForm] = useState({ email: 'admin@shop.com', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // verify the stored token belongs to an admin
  useEffect(() => {
    if (!token) return;
    api
      .get('/auth/me')
      .then((res) => {
        if (res.data.user?.role === 'admin') setAdmin(res.data.user);
        else logout();
      })
      .catch(logout);
  }, [token]);

  const login = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      if (!data.success) throw new Error(data.message);
      if (data.user.role !== 'admin') {
        setError('This account is not an admin. Use admin@shop.com / Admin@123.');
        return;
      }
      localStorage.setItem('admin_token', data.token);
      setToken(data.token);
      setAdmin(data.user);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken('');
    setAdmin(null);
  };

  return (
    <>
      <GlobalStyle />

      {!admin ? (
        <div className="login-wrap">
          <form className="login-box" onSubmit={login}>
            <h2 style={{ marginTop: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
              <i className="fa-solid fa-shield-halved" style={{ color: '#4f46e5' }} />
              ShopEase Admin
            </h2>
            <p style={{ fontSize: 13, color: '#64748b' }}>
              Sign in with an admin account to manage the store.
            </p>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <div style={{ height: 10 }} />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            {error && <p className="err">{error}</p>}
            <div style={{ height: 12 }} />
            <button className="btn" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 14 }}>
              Demo: admin@shop.com / Admin@123
            </p>
          </form>
        </div>
      ) : (
        <div className="admin">
          <aside className="sidebar">
            <div className="logo">
              <i className="fa-solid fa-bag-shopping" />
              Shop<span>Ease</span> Admin
            </div>
            <a className="active" href="#">
              <i className="fa-solid fa-gauge-high" /> Dashboard
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>
              <i className="fa-solid fa-right-from-bracket" /> Logout
            </a>
          </aside>
          <main className="content">
            <div className="topbar">
              <h1 style={{ margin: 0, fontSize: 22 }}>
                Welcome back, {admin.name} <i className="fa-regular fa-hand" />
              </h1>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                <i className="fa-solid fa-circle text-green-500" style={{ fontSize: 9 }} /> API
                connected
              </span>
            </div>
            <DashboardPage />
          </main>
        </div>
      )}
    </>
  );
}
