/**
 * src/controllers/notificationController.js
 * In-app notifications for the logged-in user (basic).
 */
const router = require('express').Router();
const { pool } = require('../config/database');
const { auth } = require('../middleware/auth');

router.use(auth);

// GET /api/notifications
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const unread = rows.filter((n) => !n.is_read).length;
    return res.json({ success: true, notifications: rows, unread });
  } catch (e) {
    return next(e);
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    return res.json({ success: true, message: 'Marked as read' });
  } catch (e) {
    return next(e);
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
