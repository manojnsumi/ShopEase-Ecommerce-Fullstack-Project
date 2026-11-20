/**
 * src/controllers/orderController.js
 * Checkout (cart -> order in one MySQL transaction),
 * order history and admin order management.
 * NOTE: /admin/all is registered BEFORE /:id so Express
 * does not treat "admin" as an order id.
 */
const router = require('express').Router();
const { pool } = require('../config/database');
const { auth, adminOnly } = require('../middleware/auth');
const { requireFields } = require('../middleware/validation');
const emailService = require('../services/emailService');

router.use(auth);

// POST /api/orders  { address, city, postalCode, phone, paymentMethod }
router.post('/', async (req, res, next) => {
  const err = requireFields(req.body, ['address', 'city', 'postalCode', 'phone']);
  if (err) return res.status(400).json({ success: false, message: err });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // lock the cart rows for this user
    const [items] = await conn.query(
      `SELECT ci.product_id, ci.quantity, p.name, p.price, p.discount_price, p.stock, p.image_url
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ? FOR UPDATE`,
      [req.user.id]
    );
    if (!items.length) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // check stock
    for (const item of items) {
      if (item.stock < item.quantity) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Not enough stock for "${item.name}" (only ${item.stock} left)`,
        });
      }
    }

    let total = items.reduce(
      (sum, i) => sum + Number(i.discount_price || i.price) * i.quantity,
      0
    );

    // optional coupon discount, validated server-side so the charged
    // total always matches what the customer saw
    let couponCode = null;
    if (req.body.couponCode) {
      const [[coupon]] = await conn.query(
        `SELECT * FROM coupons WHERE code = ? AND is_active = 1
         AND (expires_at IS NULL OR expires_at > NOW())`,
        [String(req.body.couponCode).trim().toUpperCase()]
      );
      if (!coupon) {
        await conn.rollback();
        return res
          .status(400)
          .json({ success: false, message: 'Invalid or expired coupon code' });
      }
      couponCode = coupon.code;
      total -= (total * coupon.discount_percent) / 100;
      total = Number(total.toFixed(2));
    }

    const [orderRes] = await conn.query(
      `INSERT INTO orders (user_id, total_amount, payment_method, address, city, postal_code, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        Number(total.toFixed(2)),
        req.body.paymentMethod === 'card' ? 'card' : 'cod',
        req.body.address,
        req.body.city,
        req.body.postalCode,
        req.body.phone,
      ]
    );
    const orderId = orderRes.insertId;

    for (const item of items) {
      const unitPrice = Number(item.discount_price || item.price);
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, image_url, unit_price, quantity)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.image_url, unitPrice, item.quantity]
      );
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [
        item.quantity,
        item.product_id,
      ]);
    }

    await conn.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    await conn.commit();

    emailService.send(
      req.user.email,
      `Order #${orderId} confirmed`,
      `Thanks for shopping with us! Your order total is $${total.toFixed(2)}.`
    );
    return res.status(201).json({
      success: true,
      orderId,
      total: Number(total.toFixed(2)),
      message: 'Order placed successfully',
    });
  } catch (e) {
    await conn.rollback();
    return next(e);
  } finally {
    conn.release();
  }
});

// GET /api/orders/admin/all  (admin only - placed before /:id)
router.get('/admin/all', auth, adminOnly, async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC`
    );
    return res.json({ success: true, orders });
  } catch (e) {
    return next(e);
  }
});

// GET /api/orders  (my orders)
router.get('/', async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    for (const order of orders) {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }
    return res.json({ success: true, orders });
  } catch (e) {
    return next(e);
  }
});

// GET /api/orders/:id  (own order detail)
router.get('/:id', async (req, res, next) => {
  try {
    const [[order]] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    return res.json({ success: true, order: { ...order, items } });
  } catch (e) {
    return next(e);
  }
});

// PUT /api/orders/:id/cancel  (own order, only while pending)
router.put('/:id/cancel', async (req, res, next) => {
  try {
    const [result] = await pool.query(
      `UPDATE orders SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'pending'`,
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled' });
    }
    return res.json({ success: true, message: 'Order cancelled' });
  } catch (e) {
    return next(e);
  }
});

// PUT /api/orders/:id/status  (admin only)  { status }
router.put('/:id/status', auth, adminOnly, async (req, res, next) => {
  try {
    const allowed = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    return res.json({ success: true, message: 'Status updated' });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
