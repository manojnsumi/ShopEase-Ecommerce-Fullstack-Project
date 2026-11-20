/**
 * src/controllers/userController.js
 * Profile management + admin user management (basic).
 */
const router = require('express').Router();
const { pool } = require('../config/database');
const { auth, adminOnly } = require('../middleware/auth');
const { isEmail } = require('../middleware/validation');

// GET /api/users/profile
router.get('/profile', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    return res.json({ success: true, user: rows[0] || null });
  } catch (e) {
    return next(e);
  }
});

// PUT /api/users/profile  { name, phone }
router.put('/profile', auth, async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [
      name,
      req.body.phone || null,
      req.user.id,
    ]);
    return res.json({ success: true, message: 'Profile updated' });
  } catch (e) {
    return next(e);
  }
});

// --- admin only ---
router.use(auth, adminOnly);

// GET /api/users  (list all users)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, is_blocked, created_at FROM users ORDER BY id DESC'
    );
    return res.json({ success: true, users: rows });
  } catch (e) {
    return next(e);
  }
});

// PUT /api/users/:id/block  { blocked: true|false }
router.put('/:id/block', async (req, res, next) => {
  try {
    await pool.query('UPDATE users SET is_blocked = ? WHERE id = ?', [
      req.body.blocked ? 1 : 0,
      req.params.id,
    ]);
    return res.json({ success: true, message: 'User updated' });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
