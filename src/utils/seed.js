const bcrypt = require('bcrypt');
const pool = require('../config/db');

const DEFAULT_USERNAME = 'demo';
const DEFAULT_PASSWORD = 'demo1234';
const DEFAULT_DISPLAY  = 'Demo User';

async function seedDefaultUser() {
  const [rows] = await pool.query(
    'SELECT id FROM users WHERE username = ? LIMIT 1',
    [DEFAULT_USERNAME]
  );
  if (rows.length > 0) return;

  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  await pool.query(
    'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
    [DEFAULT_USERNAME, hash, DEFAULT_DISPLAY]
  );
  console.log(`[SmartPay] Seeded default user: ${DEFAULT_USERNAME} / ${DEFAULT_PASSWORD}`);
}

module.exports = { seedDefaultUser };
