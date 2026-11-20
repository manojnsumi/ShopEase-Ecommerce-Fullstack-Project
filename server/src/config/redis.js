/**
 * src/config/redis.js
 * OPTIONAL cache layer. If REDIS_URL is set in .env and the
 * `ioredis` package is installed, real Redis is used; otherwise
 * a tiny in-memory Map is used so the project runs without Redis.
 *
 * To enable Redis on Windows later:
 *   npm install ioredis
 *   set REDIS_URL=redis://localhost:6379  (in .env)
 */
let redisClient = null;
const memory = new Map(); // key -> { value, expiresAt }

if (process.env.REDIS_URL) {
  try {
    const Redis = require('ioredis'); // optional dependency
    redisClient = new Redis(process.env.REDIS_URL);
    console.log('[redis] connected to', process.env.REDIS_URL);
  } catch (err) {
    console.warn('[redis] REDIS_URL is set but ioredis is not installed - using memory cache.');
  }
}

async function cacheGet(key) {
  if (redisClient) return redisClient.get(key);
  const hit = memory.get(key);
  if (!hit) return null;
  if (hit.expiresAt && Date.now() > hit.expiresAt) {
    memory.delete(key);
    return null;
  }
  return hit.value;
}

async function cacheSet(key, value, ttlSeconds = 60) {
  if (redisClient) return redisClient.set(key, value, 'EX', ttlSeconds);
  memory.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
  return 'OK';
}

async function cacheDel(pattern) {
  if (redisClient) return redisClient.del(pattern);
  for (const key of memory.keys()) {
    if (key.startsWith(pattern.replace('*', ''))) memory.delete(key);
  }
  return 1;
}

module.exports = { cacheGet, cacheSet, cacheDel };
