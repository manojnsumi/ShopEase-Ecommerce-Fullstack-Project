import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../App.jsx';
import LoadingScreen from './LoadingScreen.jsx';
import api, { getErrorMessage } from '../services/axios.js';

/**
 * Cart review + checkout (it lives in components/ in the original
 * folder structure, so it is kept there).
 * Steps: review items -> fill address -> place order -> mock payment.
 */
export default function CheckoutPage() {
  const { refreshCart, user } = useCart();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(null); // { orderId, total }
  const [couponMsg, setCouponMsg] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [form, setForm] = useState({
    address: '',
    city: '',
    postalCode: '',
    phone: user?.phone || '',
    paymentMethod: 'cod',
    cardNumber: '',
  });

  const loadCart = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadCart();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const changeQty = async (productId, quantity) => {
    try {
      if (quantity < 1) {
        await api.delete(`/cart/${productId}`);
      } else {
        await api.put(`/cart/${productId}`, { quantity });
      }
      loadCart();
      refreshCart();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const applyCoupon = async () => {
    setCouponMsg('');
    try {
      const { data } = await api.post('/coupons/apply', {
        code: couponCode,
        amount: cart.total,
      });
      setDiscount(data.discount);
      setCouponMsg(`Coupon ${data.code} applied: -$${data.discount.toFixed(2)}`);
    } catch (err) {
      setDiscount(0);
      setCouponMsg(getErrorMessage(err));
    }
  };

  const placeOrder = async () => {
    setError('');
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        ...form,
        // server re-validates and re-applies the coupon so the charged
        // total matches what is shown here
        couponCode: discount > 0 ? couponCode : undefined,
      });
      if (data.success) {
        // mock card payment right away if the user chose card
        if (form.paymentMethod === 'card') {
          try {
            await api.post('/payments', {
              orderId: data.orderId,
              method: 'card',
              cardNumber: form.cardNumber,
            });
          } catch (payErr) {
            // order stays pending; the message shows the payment problem
            setError(getErrorMessage(payErr, 'Order placed but payment failed'));
          }
        }
        setPlaced(data);
        refreshCart();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  // ---------- not logged in ----------
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <i className="fa-solid fa-lock text-4xl text-brand-600" />
        <h2 className="mt-4 text-xl font-semibold">Please log in to continue</h2>
        <p className="text-slate-500 text-sm mt-1">
          The cart is saved to your account, so you need to be logged in.
        </p>
        <button onClick={() => window.dispatchEvent(new Event('open-auth'))} className="btn-primary mt-6">
          <i className="fa-solid fa-right-to-bracket mr-1" /> Open login
        </button>
      </div>
    );
  }

  // ---------- success screen ----------
  if (placed) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <i className="fa-solid fa-circle-check text-5xl text-green-500" />
        <h2 className="mt-4 text-xl font-semibold">Order #{placed.orderId} placed!</h2>
        <p className="text-slate-500 text-sm mt-1">
          Total: <b>${Number(placed.total).toFixed(2)}</b> - a confirmation email was queued.
        </p>
        <Link to="/shop" className="btn-primary inline-block mt-6">
          <i className="fa-solid fa-arrow-left mr-1" /> Continue shopping
        </Link>
      </div>
    );
  }

  if (loading) return <LoadingScreen label="Loading your cart..." />;

  const finalTotal = cart ? Math.max(0, cart.total - discount) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">
        <i className="fa-solid fa-cart-shopping mr-2 text-brand-600" />
        Your cart &amp; checkout
      </h1>

      {!cart || cart.items.length === 0 ? (
        <div className="text-center py-16">
          <i className="fa-solid fa-cart-plus text-4xl text-slate-300" />
          <p className="mt-3 text-slate-500">Your cart is empty.</p>
          <Link to="/shop" className="btn-primary inline-block mt-4">
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* items */}
          <div className="lg:col-span-2 space-y-3">
            {cart.items.map((item) => (
              <div key={item.id} className="card flex items-center gap-4 p-3">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-20 w-20 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-slate-500">
                    ${Number(item.unit_price).toFixed(2)} each
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeQty(item.product_id, item.quantity - 1)}
                    className="h-8 w-8 rounded-lg border border-slate-300 hover:bg-slate-100"
                  >
                    <i className="fa-solid fa-minus text-xs" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => changeQty(item.product_id, item.quantity + 1)}
                    className="h-8 w-8 rounded-lg border border-slate-300 hover:bg-slate-100"
                  >
                    <i className="fa-solid fa-plus text-xs" />
                  </button>
                </div>
                <p className="w-20 text-right font-semibold">
                  ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => changeQty(item.product_id, 0)}
                  className="text-slate-400 hover:text-red-500"
                  aria-label="Remove"
                >
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            ))}
          </div>

          {/* summary + address form */}
          <div className="card p-5 h-fit space-y-4">
            <h2 className="font-semibold">
              <i className="fa-solid fa-truck-fast mr-2 text-brand-600" />
              Delivery details
            </h2>
            <input
              className="input"
              placeholder="Street address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input"
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <input
                className="input"
                placeholder="Postal code"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              />
            </div>
            <input
              className="input"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <h2 className="font-semibold pt-2">
              <i className="fa-solid fa-credit-card mr-2 text-brand-600" />
              Payment
            </h2>
            <div className="flex gap-2">
              {['cod', 'card'].map((m) => (
                <button
                  key={m}
                  onClick={() => setForm({ ...form, paymentMethod: m })}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                    form.paymentMethod === m
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-300'
                  }`}
                >
                  {m === 'cod' ? 'Cash on delivery' : 'Card (mock)'}
                </button>
              ))}
            </div>
            {form.paymentMethod === 'card' && (
              <input
                className="input"
                placeholder="Card number (13-16 digits, e.g. 4111111111111111)"
                value={form.cardNumber}
                onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
              />
            )}

            <div className="flex gap-2 pt-2">
              <input
                className="input"
                placeholder="Coupon code (try SAVE10)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
              <button onClick={applyCoupon} className="btn-primary whitespace-nowrap">
                Apply
              </button>
            </div>
            {couponMsg && <p className="text-xs text-slate-500">{couponMsg}</p>}

            <div className="border-t pt-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${Number(cart.total).toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={placeOrder}
              disabled={placing}
              className="btn-primary w-full disabled:opacity-50"
            >
              {placing ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin mr-1" /> Placing order...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane mr-1" /> Place order
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
