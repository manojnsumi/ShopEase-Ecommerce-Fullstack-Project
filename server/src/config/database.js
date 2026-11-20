/**
 * src/config/database.js
 * MySQL connection pool (mysql2/promise). Every controller
 * imports `pool` and runs plain SQL queries - simple and basic.
 */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: false,
});

/** Quick SELECT 1 to verify the connection at startup. */
async function testConnection() {
  const [rows] = await pool.query('SELECT 1 AS ok');
  return rows && rows[0] && rows[0].ok === 1;
}

module.exports = { pool, testConnection };
