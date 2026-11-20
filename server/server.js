/**
 * server.js - entry point of the Express REST API
 * ---------------------------------------------------
 * Loads .env (src/.env first, then the server root .env),
 * connects the middleware chain and mounts every route
 * group under /api (see src/routes/index.js).
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');

// --- env loading: prefer src/.env, fall back to server/.env ---
const srcEnv = path.join(__dirname, 'src', '.env');
const rootEnv = path.join(__dirname, '.env');
if (fs.existsSync(srcEnv)) {
  dotenv.config({ path: srcEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
}

const logger = require('./src/utils/logger');
const routes = require('./src/routes');
const { testConnection } = require('./src/config/database');
const passport = require('passport');

const app = express();
const PORT = process.env.PORT || 5000;

// --- passport setup: AFTER app is created, BEFORE routes are mounted ---
require('./src/config/passport')(passport);
app.use(passport.initialize());

// --- global middleware ---
app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5174').split(','),
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// simple http access log (writes to logs/http.log through winston)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// --- API routes ---
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'API is running', time: new Date().toISOString() })
);
app.use('/api', routes);

// --- 404 handler ---
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// --- global error handler ---
app.use((err, req, res, next) => {
  logger.error(`${err.message} - ${req.method} ${req.originalUrl}`);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

// --- start server after a quick DB check ---
async function start() {
  try {
    await testConnection();
  } catch (err) {
    const detail = `${err.code ? `(${err.code}) ` : ''}${err.message}`;
    logger.error(`Database connection failed: ${detail}`);
    console.error('\n[X] MySQL connection failed:', detail);
    console.error('    1) Make sure MySQL is running (XAMPP / MySQL service).');
    console.error('    2) Check DB_USER / DB_PASSWORD in the .env file.');
    console.error('    3) Import database/schema.sql first (see README.md).');
    process.exit(1);
  }

  app.listen(PORT, () => {
    logger.info(`Server listening on http://localhost:${PORT}`);
    console.log(`\n[OK] API server running  ->  http://localhost:${PORT}/api/health`);
  });
}

start();