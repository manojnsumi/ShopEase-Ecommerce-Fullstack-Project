/**
 * src/utils/logger.js
 * Winston logger - writes to console + files inside server/logs:
 *   error.log, combined.log, http.log, exceptions.log, rejections.log
 * (logs/audit.log is written separately by services/auditService.js)
 */
const fs = require('fs');
const path = require('path');
const winston = require('winston');

const logDir = path.join(__dirname, '..', '..', 'logs');
fs.mkdirSync(logDir, { recursive: true });

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`)
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error', maxsize: 5 * 1024 * 1024 }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log'), maxsize: 5 * 1024 * 1024 }),
    new winston.transports.File({ filename: path.join(logDir, 'http.log'), level: 'http', maxsize: 5 * 1024 * 1024 }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'rejections.log') }),
  ],
});

// show logs in the terminal while developing
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message }) => `${level}: ${message}`)
      ),
    })
  );
}

module.exports = logger;
