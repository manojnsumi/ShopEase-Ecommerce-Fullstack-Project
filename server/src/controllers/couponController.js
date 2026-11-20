/**
 * src/controllers/couponController.js
 * Coupon list / validation + admin CRUD (basic).
 */
const router = require('express').Router();
const { pool } = require('../config/database');
const { auth, adminOnly } = require('../middleware/auth');
const { requireFields } = require('../middleware/validation');

// GET /api/coupons  (public - active coupons banner)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT code, discount_percent FROM coupons
       WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())`
    );
    return res.json({ success: true, coupons: rows });
  } catch (e) {
    return next(e);
  }
});

// POST /api/coupons/apply  { code, amount }  -> returns discounted amount
router.post('/apply', auth, async (req, res, next) => {
  try {
    const err = requireFields(req.body, ['code', 'amount']);
    if (err) return res.status(400).json({ success: false, message: err });

    const [[coupon]] = await pool.query(
      `SELECT * FROM coupons WHERE code = ? AND is_active = 1
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [String(req.body.code).trim().toUpperCase()]
    );
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or expired coupon' });

    const amount = Number(req.body.amount);
    const discount = Number(((amount * coupon.discount_percent) / 100).toFixed(2));
    return res.json({
      success: true,
      code: coupon.code,
      discountPercent: coupon.discount_percent,
      discount,
      finalAmount: Number((amount - discount).toFixed(2)),
    });
  } catch (e) {
    return next(e);
  }
});

// --- admin only below ---
router.use(auth, adminOnly);

// POST /api/coupons/create
router.post('/create', async (req, res, next) => {
  try {
    const err = requireFields(req.body, ['code', 'discount_percent']);
    if (err) return res.status(400).json({ success: false, message: err });

    const percent = Number(req.body.discount_percent);
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
      return res.status(400).json({ success: false, message: 'discount_percent must be 1-100' });
    }

    try {
      await pool.query(
        'INSERT INTO coupons (code, discount_percent, expires_at) VALUES (?, ?, ?)',
        [
          String(req.body.code).trim().toUpperCase(),
          percent,
          req.body.expires_at || null,
        ]
      );
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Coupon code already exists' });
      }
      throw e;
    }
    return res.status(201).json({ success: true, message: 'Coupon created' });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/coupons/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Coupon deleted' });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
