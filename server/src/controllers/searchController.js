/**
 * src/controllers/searchController.js
 * Very basic keyword search over products and categories.
 */
const router = require('express').Router();
const { pool } = require('../config/database');
const { cacheGet, cacheSet } = require('../config/redis');

// GET /api/search?q=wireless
router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ success: true, products: [], categories: [], query: '' });

    const cacheKey = `products:search:${q.toLowerCase()}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const like = `%${q}%`;
    const [products] = await pool.query(
      `SELECT p.*, c.name AS category_name,
              COALESCE(p.discount_price, p.price) AS effective_price
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1 AND (p.name LIKE ? OR p.description LIKE ?)
       ORDER BY p.rating DESC LIMIT 30`,
      [like, like]
    );
    const [categories] = await pool.query(
      'SELECT id, name, slug, icon FROM categories WHERE name LIKE ? LIMIT 10',
      [like]
    );

    const payload = { success: true, query: q, products, categories };
    await cacheSet(cacheKey, JSON.stringify(payload), 30); // cache 30 seconds
    return res.json(payload);
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
