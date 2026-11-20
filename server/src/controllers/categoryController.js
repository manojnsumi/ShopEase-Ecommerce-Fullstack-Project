/**
 * src/controllers/categoryController.js
 * Category list + admin CRUD (basic).
 */
const router = require('express').Router();
const { pool } = require('../config/database');
const { auth, adminOnly } = require('../middleware/auth');
const { requireFields } = require('../middleware/validation');

// GET /api/categories  (public, includes product counts)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
       GROUP BY c.id ORDER BY c.name`
    );
    return res.json({ success: true, categories: rows });
  } catch (e) {
    return next(e);
  }
});

// --- admin only below ---
router.use(auth, adminOnly);

// POST /api/categories
router.post('/', async (req, res, next) => {
  try {
    const err = requireFields(req.body, ['name']);
    if (err) return res.status(400).json({ success: false, message: err });

    const slug = String(req.body.name)
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const [result] = await pool.query(
      'INSERT INTO categories (name, slug, icon) VALUES (?, ?, ?)',
      [req.body.name.trim(), slug, req.body.icon || 'fa-tag']
    );
    return res.status(201).json({ success: true, categoryId: result.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    }
    return next(e);
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'UPDATE categories SET name = ?, icon = ? WHERE id = ?',
      [req.body.name, req.body.icon || 'fa-tag', req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Category not found' });
    return res.json({ success: true, message: 'Category updated' });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Category deleted' });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
