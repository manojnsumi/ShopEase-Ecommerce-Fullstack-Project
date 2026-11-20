/**
 * src/controllers/paymentController.js
 * BASIC mock payment handling - no real gateway.
 *   method "cod"  -> payment stays "pending" until delivery
 *   method "card" -> card number is only length-checked, then
 *                    the payment is marked "completed" and the
 *                    order becomes "paid".
 * Replace this with Stripe / Razorpay later.
 */
const router = require('express').Router();
const { pool } = require('../config/database');
const { auth } = require('../middleware/auth');
const { requireFields } = require('../middleware/validation');
const auditService = require('../services/auditService');

router.use(auth);

// POST /api/payments  { orderId, method, cardNumber? }
router.post('/', async (req, res, next) => {
  try {
    const err = requireFields(req.body, ['orderId', 'method']);
    if (err) return res.status(400).json({ success: false, message: err });
    const method = req.body.method === 'card' ? 'card' : 'cod';

    const [[order]] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.body.orderId, req.user.id]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // already paid?
    const [[existing]] = await pool.query(
      "SELECT id FROM payments WHERE order_id = ? AND status = 'completed'",
      [order.id]
    );
    if (existing) return res.status(409).json({ success: false, message: 'Order is already paid' });

    let status = 'pending';
    let ref = null;

    if (method === 'card') {
      const cardNumber = String(req.body.cardNumber || '').replace(/\s+/g, '');
      if (!/^\d{13,16}$/.test(cardNumber)) {
        return res.status(400).json({ success: false, message: 'Card number must be 13-16 digits' });
      }
      status = 'completed';
      ref = `MOCK-${Date.now()}`;
      await pool.query("UPDATE orders SET status = 'paid' WHERE id = ?", [order.id]);
    }

    await pool.query(
      'INSERT INTO payments (order_id, amount, method, status, transaction_ref) VALUES (?, ?, ?, ?, ?)',
      [order.id, order.total_amount, method, status, ref]
    );
    auditService.audit('PAYMENT', req.user.id, `order #${order.id} ${method} ${status}`);

    return res.status(201).json({
      success: true,
      message:
        method === 'card'
          ? 'Payment completed (mock)'
          : 'Cash on delivery - pay when the order arrives',
      transactionRef: ref,
    });
  } catch (e) {
    return next(e);
  }
});

// GET /api/payments/order/:orderId
router.get('/order/:orderId', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.* FROM payments p JOIN orders o ON o.id = p.order_id
       WHERE p.order_id = ? AND o.user_id = ? ORDER BY p.created_at DESC`,
      [req.params.orderId, req.user.id]
    );
    return res.json({ success: true, payments: rows });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
