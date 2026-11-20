/**
 * src/services/invoiceService.js
 * Builds a plain-text invoice for an order and also saves a
 * copy under server/src/logs/invoices/ (basic version).
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const invoiceDir = path.join(__dirname, '..', 'logs', 'invoices');

async function generateInvoice(orderId) {
  const [[order]] = await pool.query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email
     FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
    [orderId]
  );
  if (!order) throw new Error('Order not found');

  const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

  const lines = [];
  lines.push('==========================================');
  lines.push('            SHOPEASE INVOICE              ');
  lines.push('==========================================');
  lines.push(`Invoice for Order : #${order.id}`);
  lines.push(`Date              : ${new Date(order.created_at).toISOString().slice(0, 10)}`);
  lines.push(`Customer          : ${order.customer_name} (${order.customer_email})`);
  lines.push(`Ship to           : ${order.address}, ${order.city} ${order.postal_code}`);
  lines.push(`Phone             : ${order.phone}`);
  lines.push(`Payment method    : ${order.payment_method}`);
  lines.push(`Order status      : ${order.status}`);
  lines.push('------------------------------------------');
  lines.push('ITEMS');
  for (const item of items) {
    const lineTotal = (Number(item.unit_price) * item.quantity).toFixed(2);
    lines.push(
      `  - ${item.product_name} x ${item.quantity} @ $${Number(item.unit_price).toFixed(2)} = $${lineTotal}`
    );
  }
  lines.push('------------------------------------------');
  lines.push(`TOTAL: $${Number(order.total_amount).toFixed(2)}`);
  lines.push('==========================================');
  lines.push('Thank you for shopping with ShopEase!');

  const text = lines.join('\n');

  try {
    fs.mkdirSync(invoiceDir, { recursive: true });
    fs.writeFileSync(path.join(invoiceDir, `invoice_order_${order.id}.txt`), text);
  } catch (err) {
    // invoice file saving is best-effort, never break the API
  }

  return text;
}

module.exports = { generateInvoice };
