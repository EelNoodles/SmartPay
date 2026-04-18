const pool = require('../config/db');

async function findByUsername(username) {
  const [rows] = await pool.query(
    'SELECT id, username, password_hash, display_name FROM users WHERE username = ? LIMIT 1',
    [username]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, username, display_name FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function create({ username, passwordHash, displayName }) {
  const [res] = await pool.query(
    'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
    [username, passwordHash, displayName || null]
  );
  return res.insertId;
}

module.exports = { findByUsername, findById, create };
