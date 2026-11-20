/**
 * src/controllers/adminController.js
 * Dashboard statistics for the admin panel (basic aggregations).
 */
const router = require('express').Router();
const { pool } = require('../config/database');
const { auth, adminOnly } = require('../middleware/auth');
const invoiceService = require('../services/invoiceService');

router.use(auth, adminOnly);

// GET /api/admin/stats  - cards for the dashboard
router.get('/stats', async (req, res, next) => {
  try {
    const [[counts]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users)                        AS totalUsers,
         (SELECT COUNT(*) FROM products WHERE is_active = 1) AS totalProducts,
         (SELECT COUNT(*) FROM orders)                       AS totalOrders,
         (SELECT COALESCE(SUM(total_amount), 0) FROM orders
            WHERE status IN ('paid','shipped','delivered'))  AS totalRevenue`
    );
    const [[lowStock]] = await pool.query(
      'SELECT COUNT(*) AS n FROM products WHERE stock <= 5 AND is_active = 1'
    );

    const [recentOrders] = await pool.query(
      `SELECT o.id, o.total_amount, o.status, o.created_at, u.name AS customer_name
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC LIMIT 8`
    );
    const [topProducts] = await pool.query(
      `SELECT oi.product_name, SUM(oi.quantity) AS sold
       FROM order_items oi GROUP BY oi.product_name ORDER BY sold DESC LIMIT 5`
    );

    return res.json({
      success: true,
      stats: {
        ...counts,
        lowStock: lowStock.n,
      },
      recentOrders,
      topProducts,
    });
  } catch (e) {
    return next(e);
  }
});

// GET /api/admin/invoice/:orderId  - plain-text invoice (basic)
router.get('/invoice/:orderId', async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }
    const text = await invoiceService.generateInvoice(orderId);
    res.setHeader('Content-Type', 'text/plain');
    return res.send(text);
  } catch (e) {
    if (e.message === 'Order not found') {
      return res.status(404).json({ success: false, message: e.message });
    }
    return next(e);
  }
});

module.exports = router;
