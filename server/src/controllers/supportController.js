/**
 * src/controllers/supportController.js
 * Support tickets with a simple message thread (basic).
 */
const router = require('express').Router();
const { pool } = require('../config/database');
const { auth, adminOnly } = require('../middleware/auth');
const { requireFields } = require('../middleware/validation');
const emailService = require('../services/emailService');

router.use(auth);

// GET /api/support/admin/all  (admin only - placed BEFORE /:id)
router.get('/admin/all', adminOnly, async (req, res, next) => {
  try {
    const [tickets] = await pool.query(
      `SELECT t.*, u.name AS user_name, u.email AS user_email
       FROM support_tickets t JOIN users u ON u.id = t.user_id
       ORDER BY t.created_at DESC`
    );
    return res.json({ success: true, tickets });
  } catch (e) {
    return next(e);
  }
});

// POST /api/support  { subject, message }  (open a ticket)
router.post('/', async (req, res, next) => {
  try {
    const err = requireFields(req.body, ['subject', 'message']);
    if (err) return res.status(400).json({ success: false, message: err });

    const [ticketRes] = await pool.query(
      'INSERT INTO support_tickets (user_id, subject) VALUES (?, ?)',
      [req.user.id, req.body.subject.trim()]
    );
    await pool.query(
      'INSERT INTO support_messages (ticket_id, sender, message) VALUES (?, ?, ?)',
      [ticketRes.insertId, 'user', req.body.message]
    );
    return res.status(201).json({
      success: true,
      ticketId: ticketRes.insertId,
      message: 'Support ticket created - we will reply soon',
    });
  } catch (e) {
    return next(e);
  }
});

// GET /api/support  (my tickets)
router.get('/', async (req, res, next) => {
  try {
    const [tickets] = await pool.query(
      'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json({ success: true, tickets });
  } catch (e) {
    return next(e);
  }
});

// GET /api/support/:id  (ticket + message thread, own or admin)
router.get('/:id', async (req, res, next) => {
  try {
    const [[ticket]] = await pool.query(
      `SELECT t.*, u.name AS user_name, u.email AS user_email
       FROM support_tickets t JOIN users u ON u.id = t.user_id
       WHERE t.id = ? AND (t.user_id = ? OR ?)`,
      [req.params.id, req.user.id, req.user.role === 'admin']
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const [messages] = await pool.query(
      'SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    return res.json({ success: true, ticket, messages });
  } catch (e) {
    return next(e);
  }
});

// POST /api/support/:id/messages  { message }  (user reply)
router.post('/:id/messages', async (req, res, next) => {
  try {
    const err = requireFields(req.body, ['message']);
    if (err) return res.status(400).json({ success: false, message: err });

    const [[ticket]] = await pool.query(
      'SELECT * FROM support_tickets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (ticket.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Ticket is closed' });
    }

    await pool.query(
      'INSERT INTO support_messages (ticket_id, sender, message) VALUES (?, ?, ?)',
      [ticket.id, 'user', req.body.message]
    );
    return res.status(201).json({ success: true, message: 'Reply sent' });
  } catch (e) {
    return next(e);
  }
});

// --- admin only below ---
router.use(adminOnly);

// POST /api/support/:id/reply  { message, status? }
router.post('/:id/reply', async (req, res, next) => {
  try {
    const err = requireFields(req.body, ['message']);
    if (err) return res.status(400).json({ success: false, message: err });

    const [[ticket]] = await pool.query('SELECT * FROM support_tickets WHERE id = ?', [req.params.id]);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    await pool.query(
      'INSERT INTO support_messages (ticket_id, sender, message) VALUES (?, ?, ?)',
      [ticket.id, 'admin', req.body.message]
    );
    await pool.query('UPDATE support_tickets SET status = ? WHERE id = ?', [
      req.body.status === 'closed' ? 'closed' : 'answered',
      ticket.id,
    ]);

    const [[user]] = await pool.query('SELECT email FROM users WHERE id = ?', [ticket.user_id]);
    emailService.send(user.email, `Re: ${ticket.subject}`, req.body.message);
    return res.status(201).json({ success: true, message: 'Reply sent' });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
