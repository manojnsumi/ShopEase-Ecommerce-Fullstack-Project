/**
 * src/controllers/authController.js
 * Register / Login / Profile - basic JWT authentication.
 * Login uses the passport 'local' strategy from config/passport.js.
 */
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { pool } = require('../config/database');
const { auth } = require('../middleware/auth');
const { requireFields, isEmail } = require('../middleware/validation');
const auditService = require('../services/auditService');

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const err = requireFields(req.body, ['name', 'email', 'password']);
    if (err) return res.status(400).json({ success: false, message: err });
    if (!isEmail(req.body.email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }
    if (String(req.body.password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [req.body.email]);
    if (exists.length) {
      return res.status(409).json({ success: false, message: 'This email is already registered' });
    }

    const hash = await bcrypt.hash(req.body.password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
      [req.body.name.trim(), req.body.email.trim().toLowerCase(), hash, req.body.phone || null]
    );

    auditService.audit('USER_REGISTER', result.insertId, req.body.email);
    return res.status(201).json({ success: true, message: 'Account created. You can log in now.' });
  } catch (e) {
    return next(e);
  }
});

// POST /api/auth/login  { email, password }
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ success: false, message: info.message });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    auditService.audit('USER_LOGIN', user.id, user.email);
    return res.json({ success: true, token, user });
  })(req, res, next);
});

// GET /api/auth/me  (logged-in profile)
router.get('/me', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user: rows[0] });
  } catch (e) {
    return next(e);
  }
});

// PUT /api/auth/change-password  { oldPassword, newPassword }
router.put('/change-password', auth, async (req, res, next) => {
  try {
    const err = requireFields(req.body, ['oldPassword', 'newPassword']);
    if (err) return res.status(400).json({ success: false, message: err });

    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const ok = rows.length && (await bcrypt.compare(req.body.oldPassword, rows[0].password));
    if (!ok) return res.status(400).json({ success: false, message: 'Old password is incorrect' });
    if (String(req.body.newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const hash = await bcrypt.hash(req.body.newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    return res.json({ success: true, message: 'Password updated' });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
