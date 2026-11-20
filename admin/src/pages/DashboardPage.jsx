import { useEffect, useState } from 'react';
import { api } from '../App.jsx';

/**
 * Dashboard page (basic admin):
 * 1. stat cards from GET /api/admin/stats
 * 2. recent orders with status update + invoice download
 * 3. product management: add product form + list with delete
 */
export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    category_id: '',
    image_url: '',
    description: '',
  });

  const loadAll = () => {
    api.get('/admin/stats').then((res) => {
      setStats(res.data.stats);
      setRecentOrders(res.data.recentOrders || []);
      setTopProducts(res.data.topProducts || []);
    }).catch((e) => setError(e?.response?.data?.message || 'Could not load stats'));

    api.get('/products?limit=50').then((res) => setProducts(res.data.products || []));
    api.get('/categories').then((res) => setCategories(res.data.categories || []));
  };

  useEffect(loadAll, []);

  const addProduct = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/products', {
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock || 0),
        category_id: Number(newProduct.category_id),
      });
      if (data.success) {
        setMessage(`Product "${newProduct.name}" added`);
        setNewProduct({ name: '', price: '', stock: '', category_id: '', image_url: '', description: '' });
        loadAll();
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not add product');
    }
  };

  const deleteProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      setMessage(`Product "${name}" deleted`);
      loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not delete product');
    }
  };

  const setStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setRecentOrders((orders) =>
        orders.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update status');
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const res = await api.get(`/admin/invoice/${orderId}`, { responseType: 'text' });
      const blob = new Blob([res.data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not build invoice');
    }
  };

  return (
    <div>
      {error && <p className="err"><i className="fa-solid fa-circle-exclamation" /> {error}</p>}
      {message && <p className="ok"><i className="fa-solid fa-circle-check" /> {message}</p>}

      {/* ---- stat cards ---- */}
      <div className="cards">
        <div className="card">
          <h3><i className="fa-solid fa-users" /> Total users</h3>
          <p>{stats ? stats.totalUsers : '...'}</p>
        </div>
        <div className="card">
          <h3><i className="fa-solid fa-box" /> Active products</h3>
          <p>{stats ? stats.totalProducts : '...'}</p>
        </div>
        <div className="card">
          <h3><i className="fa-solid fa-receipt" /> Orders</h3>
          <p>{stats ? stats.totalOrders : '...'}</p>
        </div>
        <div className="card">
          <h3><i className="fa-solid fa-dollar-sign" /> Revenue</h3>
          <p>{stats ? `$${Number(stats.totalRevenue).toFixed(2)}` : '...'}</p>
        </div>
        <div className="card">
          <h3><i className="fa-solid fa-triangle-exclamation" /> Low stock (≤5)</h3>
          <p>{stats ? stats.lowStock : '...'}</p>
        </div>
      </div>

      {/* ---- recent orders ---- */}
      <h2 className="section-title"><i className="fa-solid fa-clock-rotate-left" /> Recent orders</h2>
      <table>
        <thead>
          <tr>
            <th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Change status</th><th>Invoice</th>
          </tr>
        </thead>
        <tbody>
          {recentOrders.length === 0 && (
            <tr><td colSpan="6" style={{ color: '#94a3b8' }}>No orders yet.</td></tr>
          )}
          {recentOrders.map((o) => (
            <tr key={o.id}>
              <td>#{o.id}</td>
              <td>{o.customer_name}</td>
              <td>${Number(o.total_amount).toFixed(2)}</td>
              <td><span className={`badge ${o.status}`}>{o.status}</span></td>
              <td>
                <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} style={{ width: 140 }}>
                  {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td>
                <button className="btn ghost" onClick={() => downloadInvoice(o.id)}>
                  <i className="fa-solid fa-file-lines" /> View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ---- top products ---- */}
      <h2 className="section-title"><i className="fa-solid fa-fire" /> Best sellers</h2>
      <table>
        <thead>
          <tr><th>Product</th><th>Units sold</th></tr>
        </thead>
        <tbody>
          {topProducts.length === 0 && (
            <tr><td colSpan="2" style={{ color: '#94a3b8' }}>No sales yet.</td></tr>
          )}
          {topProducts.map((p) => (
            <tr key={p.product_name}>
              <td>{p.product_name}</td>
              <td>{p.sold}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ---- add product ---- */}
      <h2 className="section-title"><i className="fa-solid fa-plus" /> Add product</h2>
      <form className="card" onSubmit={addProduct}>
        <div className="row" style={{ marginBottom: 10 }}>
          <input
            placeholder="Product name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            required
          />
          <select
            value={newProduct.category_id}
            onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
            required
          >
            <option value="">Select category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="row" style={{ marginBottom: 10 }}>
          <input
            type="number" step="0.01" min="0" placeholder="Price ($)"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            required
          />
          <input
            type="number" min="0" placeholder="Stock"
            value={newProduct.stock}
            onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
          />
          <input
            placeholder="Image URL (https://images.unsplash.com/...)"
            value={newProduct.image_url}
            onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
            required
          />
        </div>
        <textarea
          rows="2" placeholder="Description"
          value={newProduct.description}
          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
        />
        <div style={{ height: 10 }} />
        <button className="btn"><i className="fa-solid fa-cloud-arrow-up" /> Save product</button>
      </form>

      {/* ---- product list ---- */}
      <h2 className="section-title"><i className="fa-solid fa-boxes-stacked" /> Products ({products.length})</h2>
      <table>
        <thead>
          <tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <img src={p.image_url} alt={p.name} width="46" height="46" style={{ borderRadius: 10, objectFit: 'cover' }} />
              </td>
              <td>{p.name}</td>
              <td>{p.category_name}</td>
              <td>${Number(p.discount_price || p.price).toFixed(2)}</td>
              <td>{p.stock}</td>
              <td>
                <button className="btn danger" onClick={() => deleteProduct(p.id, p.name)}>
                  <i className="fa-solid fa-trash" /> Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
