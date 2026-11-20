/**
 * src/services/emailService.js
 * BASIC email stub - emails are written to server/src/logs/email.log
 * and printed to the console instead of being really sent.
 *
 * To send real emails later, install nodemailer and put your
 * SMTP settings in .env, then replace the body of send():
 *   npm install nodemailer
 */
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const emailLog = path.join(__dirname, '..', 'logs', 'email.log');

function send(to, subject, text) {
  const line = `[EMAIL -> ${to}] subject: ${subject} | body: ${text}`;
  console.log(line);
  fs.appendFileSync(emailLog, `${new Date().toISOString()} ${line}\n`);
  logger.info(`Email queued for ${to} (stub - see src/logs/email.log)`);
  return true;
}

module.exports = { send };
