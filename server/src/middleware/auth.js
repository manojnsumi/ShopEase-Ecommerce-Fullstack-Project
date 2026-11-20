/**
 * src/middleware/auth.js
 * Two small guards used by the routes:
 *   auth      - requires a valid "Authorization: Bearer <jwt>" header
 *   adminOnly - requires role === 'admin' (must run AFTER auth)
 */
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Please log in first' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expired, please log in again' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access only' });
  }
  return next();
}

module.exports = { auth, adminOnly };
