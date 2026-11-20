/**
 * src/controllers/cartController.js
 * Shopping cart stored in MySQL (cart_items table).
 */
const router = require('express').Router();
const { pool } = require('../config/database');
const { auth } = require('../middleware/auth');
const { isPositiveInt } = require('../middleware/validation');

router.use(auth); // everything below needs a logged-in user

// GET /api/cart
router.get('/', async (req, res, next) => {
  try {
    const [items] = await pool.query(
      `SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.slug, p.image_url,
              p.price, p.discount_price, p.stock,
              COALESCE(p.discount_price, p.price) AS unit_price
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ? ORDER BY ci.id DESC`,
      [req.user.id]
    );
    const total = items.reduce((sum, i) => sum + Number(i.unit_price) * i.quantity, 0);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    return res.json({ success: true, items, total: Number(total.toFixed(2)), count });
  } catch (e) {
    return next(e);
  }
});

// POST /api/cart  { productId, quantity }
router.post('/', async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    if (!isPositiveInt(productId)) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }
    const qty = Math.max(1, Number(quantity || 1));

    const [[product]] = await pool.query('SELECT id, stock FROM products WHERE id = ? AND is_active = 1', [productId]);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.stock < qty) return res.status(400).json({ success: false, message: 'Not enough stock' });

    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [req.user.id, productId, qty]
    );
    return res.status(201).json({ success: true, message: 'Added to cart' });
  } catch (e) {
    return next(e);
  }
});

// PUT /api/cart/:productId  { quantity }
router.put('/:productId', async (req, res, next) => {
  try {
    const qty = Number(req.body.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'quantity must be >= 1' });
    }
    const [result] = await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [qty, req.user.id, req.params.productId]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Item not in cart' });
    return res.json({ success: true, message: 'Cart updated' });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/cart/:productId
router.delete('/:productId', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [
      req.user.id,
      req.params.productId,
    ]);
    return res.json({ success: true, message: 'Item removed' });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/cart  (clear whole cart)
router.delete('/', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    return res.json({ success: true, message: 'Cart cleared' });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
