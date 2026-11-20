/**
 * src/services/auditService.js
 * Appends audit entries to server/src/logs/audit.log
 * (winston file transport - one line per action).
 */
const fs = require('fs');
const path = require('path');
const winston = require('winston');

const logDir = path.join(__dirname, '..', 'logs');
fs.mkdirSync(logDir, { recursive: true });

const auditLogger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'audit.log'),
      maxsize: 5 * 1024 * 1024,
    }),
  ],
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, message }) => `${timestamp} | ${message}`)
  ),
});

/**
 * audit('USER_LOGIN', userId, 'detail text')
 */
function audit(action, actorId = null, detail = '') {
  auditLogger.info(`${action} | actor=${actorId ?? 'guest'} | ${detail}`);
}

module.exports = { audit };
