/**
 * src/controllers/productController.js
 * Product list / detail + admin create / update / delete.
 */
const router = require('express').Router();
const { pool } = require('../config/database');
const { auth, adminOnly } = require('../middleware/auth');
const { requireFields, isNonNegativeNumber } = require('../middleware/validation');
const { cacheDel } = require('../config/redis');
const auditService = require('../services/auditService');

// GET /api/products?category=electronics&sort=price_asc&page=1&limit=12
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Number(req.query.limit || 12));
    const offset = (page - 1) * limit;

    const where = ['p.is_active = 1'];
    const params = [];
    if (req.query.category) {
      where.push('c.slug = ?');
      params.push(req.query.category);
    }
    if (req.query.minPrice) {
      where.push('COALESCE(p.discount_price, p.price) >= ?');
      params.push(Number(req.query.minPrice));
    }
    if (req.query.maxPrice) {
      where.push('COALESCE(p.discount_price, p.price) <= ?');
      params.push(Number(req.query.maxPrice));
    }

    const orderSql =
      req.query.sort === 'price_asc'
        ? 'ORDER BY effective_price ASC'
        : req.query.sort === 'price_desc'
          ? 'ORDER BY effective_price DESC'
          : req.query.sort === 'rating'
            ? 'ORDER BY p.rating DESC'
            : 'ORDER BY p.id DESC';

    const whereSql = where.join(' AND ');
    const listSql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
             COALESCE(p.discount_price, p.price) AS effective_price
      FROM products p JOIN categories c ON c.id = p.category_id
      WHERE ${whereSql} ${orderSql}
      LIMIT ? OFFSET ?`;

    const [rows] = await pool.query(listSql, [...params, limit, offset]);
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p JOIN categories c ON c.id = p.category_id WHERE ${whereSql}`,
      params
    );

    return res.json({ success: true, products: rows, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    return next(e);
  }
});

// GET /api/products/:id  (id or slug)
router.get('/:idOrSlug', async (req, res, next) => {
  try {
    const key = req.params.idOrSlug;
    const isNumeric = /^\d+$/.test(key);
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE ${isNumeric ? 'p.id = ?' : 'p.slug = ?'} LIMIT 1`,
      [key]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.json({ success: true, product: rows[0] });
  } catch (e) {
    return next(e);
  }
});

// --- admin only below ---
router.use(auth, adminOnly);

// POST /api/products  (create)
router.post('/', async (req, res, next) => {
  try {
    const err = requireFields(req.body, ['name', 'price', 'category_id', 'image_url']);
    if (err) return res.status(400).json({ success: false, message: err });
    if (!isNonNegativeNumber(req.body.price)) {
      return res.status(400).json({ success: false, message: 'Price must be a number' });
    }

    const slug = String(req.body.name)
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const [result] = await pool.query(
      `INSERT INTO products (name, slug, description, price, discount_price, category_id, image_url, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.body.name.trim(),
        `${slug}-${Date.now().toString().slice(-5)}`,
        req.body.description || '',
        Number(req.body.price),
        req.body.discount_price ? Number(req.body.discount_price) : null,
        Number(req.body.category_id),
        req.body.image_url,
        Number(req.body.stock || 0),
      ]
    );
    await cacheDel('products:*');
    auditService.audit('PRODUCT_CREATE', req.user.id, req.body.name);
    return res.status(201).json({ success: true, productId: result.insertId });
  } catch (e) {
    return next(e);
  }
});

// PUT /api/products/:id  (update)
router.put('/:id', async (req, res, next) => {
  try {
    const fields = [];
    const params = [];
    const allowed = ['name', 'description', 'price', 'discount_price', 'category_id', 'image_url', 'stock', 'is_active'];
    for (const f of allowed) {
      if (req.body[f] !== undefined) {
        fields.push(`${f} = ?`);
        params.push(f === 'discount_price' && !req.body[f] ? null : req.body[f]);
      }
    }
    if (!fields.length) return res.status(400).json({ success: false, message: 'Nothing to update' });

    params.push(req.params.id);
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);
    await cacheDel('products:*');
    auditService.audit('PRODUCT_UPDATE', req.user.id, `product #${req.params.id}`);
    return res.json({ success: true, message: 'Product updated' });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    await cacheDel('products:*');
    auditService.audit('PRODUCT_DELETE', req.user.id, `product #${req.params.id}`);
    return res.json({ success: true, message: 'Product deleted' });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
