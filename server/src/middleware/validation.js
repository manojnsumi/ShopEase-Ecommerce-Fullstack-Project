/**
 * src/middleware/validation.js
 * Very small hand-rolled validators - no external package needed.
 */

/** Returns an error string if any required field is missing/empty. */
function requireFields(body, fields) {
  for (const f of fields) {
    const v = body ? body[f] : undefined;
    if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
      return `Field "${f}" is required`;
    }
  }
  return null;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

function isPositiveInt(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function isNonNegativeNumber(value) {
  return !Number.isNaN(Number(value)) && Number(value) >= 0;
}

module.exports = { requireFields, isEmail, isPositiveInt, isNonNegativeNumber };
