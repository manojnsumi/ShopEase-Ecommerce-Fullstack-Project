/**
 * src/controllers/reviewController.js
 * Product reviews (1 review per user per product) and
 * automatic product rating re-calculation.
 */
const router = require('express').Router();
const { pool } = require('../config/database');
const { auth } = require('../middleware/auth');
const { isPositiveInt } = require('../middleware/validation');

// GET /api/reviews/product/:productId  (public)
router.get('/product/:productId', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? ORDER BY r.created_at DESC`,
      [req.params.productId]
    );
    return res.json({ success: true, reviews: rows });
  } catch (e) {
    return next(e);
  }
});

// POST /api/reviews  { productId, rating, comment }  (logged in)
router.post('/', auth, async (req, res, next) => {
  try {
    if (!isPositiveInt(req.body.productId)) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be 1-5' });
    }

    try {
      await pool.query(
        'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
        [req.body.productId, req.user.id, rating, req.body.comment || '']
      );
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'You already reviewed this product' });
      }
      throw e;
    }

    // recompute average rating for the product
    await pool.query(
      `UPDATE products SET rating = (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE product_id = ?)
       WHERE id = ?`,
      [req.body.productId, req.body.productId]
    );
    return res.status(201).json({ success: true, message: 'Review added' });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/reviews/:id  (own review or admin)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const [[review]] = await pool.query('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }
    await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    await pool.query(
      `UPDATE products SET rating = COALESCE(
         (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE product_id = ?), 0)
       WHERE id = ?`,
      [review.product_id, review.product_id]
    );
    return res.json({ success: true, message: 'Review deleted' });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
