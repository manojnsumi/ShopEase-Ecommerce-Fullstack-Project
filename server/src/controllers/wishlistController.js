/**
 * src/controllers/wishlistController.js
 * Save products for later (basic list / add / remove).
 */
const router = require('express').Router();
const { pool } = require('../config/database');
const { auth } = require('../middleware/auth');
const { isPositiveInt } = require('../middleware/validation');

router.use(auth);

// GET /api/wishlist
router.get('/', async (req, res, next) => {
  try {
    const [items] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.image_url, p.price, p.discount_price, p.rating,
              COALESCE(p.discount_price, p.price) AS effective_price, w.created_at
       FROM wishlist w JOIN products p ON p.id = w.product_id
       WHERE w.user_id = ? ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, items });
  } catch (e) {
    return next(e);
  }
});

// POST /api/wishlist  { productId }
router.post('/', async (req, res, next) => {
  try {
    if (!isPositiveInt(req.body.productId)) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }
    await pool.query(
      'INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)',
      [req.user.id, req.body.productId]
    );
    return res.status(201).json({ success: true, message: 'Added to wishlist' });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [
      req.user.id,
      req.params.productId,
    ]);
    return res.json({ success: true, message: 'Removed from wishlist' });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
