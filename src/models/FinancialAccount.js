const pool = require('../config/db');

const SELECT_COLS = `
  id, user_id, account_type, bank_or_provider_name, card_or_account_name,
  last_four_digits, image_path, created_at
`;

async function listByUser(userId) {
  const [rows] = await pool.query(
    `SELECT ${SELECT_COLS}
       FROM financial_accounts
      WHERE user_id = ?
      ORDER BY account_type ASC, created_at DESC`,
    [userId]
  );
  return rows;
}

async function findById(id, userId) {
  const [rows] = await pool.query(
    `SELECT ${SELECT_COLS}
       FROM financial_accounts
      WHERE id = ? AND user_id = ?
      LIMIT 1`,
    [id, userId]
  );
  return rows[0] || null;
}

async function create(userId, data) {
  const [res] = await pool.query(
    `INSERT INTO financial_accounts
       (user_id, account_type, bank_or_provider_name, card_or_account_name, last_four_digits, image_path)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.account_type,
      data.bank_or_provider_name,
      data.card_or_account_name,
      data.last_four_digits || null,
      data.image_path || null
    ]
  );
  return res.insertId;
}

async function update(id, userId, data) {
  const fields = [];
  const values = [];
  for (const key of [
    'account_type',
    'bank_or_provider_name',
    'card_or_account_name',
    'last_four_digits',
    'image_path'
  ]) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (fields.length === 0) return false;
  values.push(id, userId);
  const [res] = await pool.query(
    `UPDATE financial_accounts SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );
  return res.affectedRows > 0;
}

async function remove(id, userId) {
  const [res] = await pool.query(
    'DELETE FROM financial_accounts WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return res.affectedRows > 0;
}

/**
 * Minimal projection used when building AI prompts — image_path and timestamps
 * are intentionally stripped to reduce token usage.
 */
async function listForPrompt(userId) {
  const [rows] = await pool.query(
    `SELECT id, account_type, bank_or_provider_name, card_or_account_name, last_four_digits
       FROM financial_accounts
      WHERE user_id = ?`,
    [userId]
  );
  return rows;
}

module.exports = { listByUser, findById, create, update, remove, listForPrompt };
