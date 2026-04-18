const pool = require('../config/db');
const { safeParseJSON } = require('../utils/jsonSafe');

const SELECT_COLS = `
  rc.id, rc.financial_account_id, rc.campaign_name, rc.description,
  rc.start_date, rc.end_date, rc.reward_rate, rc.reward_cap_amount,
  rc.reward_cap_period, rc.min_spend_amount, rc.applicable_days,
  rc.target_merchants, rc.requires_registration, rc.is_quota_limited,
  rc.requires_plan_switch, rc.required_plan_name,
  rc.created_at
`;

function normalizeRow(row) {
  if (!row) return row;
  return {
    ...row,
    applicable_days:  safeParseJSON(row.applicable_days, []),
    target_merchants: safeParseJSON(row.target_merchants, []),
    requires_registration: !!row.requires_registration,
    is_quota_limited:      !!row.is_quota_limited,
    requires_plan_switch:  !!row.requires_plan_switch
  };
}

async function listByUser(userId) {
  const [rows] = await pool.query(
    `SELECT ${SELECT_COLS},
            fa.card_or_account_name, fa.bank_or_provider_name, fa.account_type
       FROM reward_campaigns rc
       JOIN financial_accounts fa ON fa.id = rc.financial_account_id
      WHERE fa.user_id = ?
      ORDER BY rc.end_date IS NULL, rc.end_date ASC, rc.created_at DESC`,
    [userId]
  );
  return rows.map(normalizeRow);
}

async function listByAccount(accountId, userId) {
  const [rows] = await pool.query(
    `SELECT ${SELECT_COLS}
       FROM reward_campaigns rc
       JOIN financial_accounts fa ON fa.id = rc.financial_account_id
      WHERE rc.financial_account_id = ? AND fa.user_id = ?
      ORDER BY rc.end_date IS NULL, rc.end_date ASC, rc.created_at DESC`,
    [accountId, userId]
  );
  return rows.map(normalizeRow);
}

async function findById(id, userId) {
  const [rows] = await pool.query(
    `SELECT ${SELECT_COLS}
       FROM reward_campaigns rc
       JOIN financial_accounts fa ON fa.id = rc.financial_account_id
      WHERE rc.id = ? AND fa.user_id = ?
      LIMIT 1`,
    [id, userId]
  );
  return rows[0] ? normalizeRow(rows[0]) : null;
}

async function create(data) {
  const [res] = await pool.query(
    `INSERT INTO reward_campaigns
       (financial_account_id, campaign_name, description, start_date, end_date,
        reward_rate, reward_cap_amount, reward_cap_period, min_spend_amount,
        applicable_days, target_merchants, requires_registration, is_quota_limited,
        requires_plan_switch, required_plan_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.financial_account_id,
      data.campaign_name,
      data.description || '',
      data.start_date || null,
      data.end_date || null,
      data.reward_rate ?? 0,
      data.reward_cap_amount ?? null,
      data.reward_cap_period ?? 0,
      data.min_spend_amount ?? null,
      JSON.stringify(data.applicable_days || []),
      JSON.stringify(data.target_merchants || []),
      data.requires_registration ? 1 : 0,
      data.is_quota_limited ? 1 : 0,
      data.requires_plan_switch ? 1 : 0,
      data.required_plan_name || null
    ]
  );
  return res.insertId;
}

async function update(id, userId, data) {
  const [res] = await pool.query(
    `UPDATE reward_campaigns rc
       JOIN financial_accounts fa ON fa.id = rc.financial_account_id
        SET rc.financial_account_id = ?,
            rc.campaign_name        = ?,
            rc.description          = ?,
            rc.start_date           = ?,
            rc.end_date             = ?,
            rc.reward_rate          = ?,
            rc.reward_cap_amount    = ?,
            rc.reward_cap_period    = ?,
            rc.min_spend_amount     = ?,
            rc.applicable_days      = ?,
            rc.target_merchants     = ?,
            rc.requires_registration = ?,
            rc.is_quota_limited      = ?,
            rc.requires_plan_switch  = ?,
            rc.required_plan_name    = ?
      WHERE rc.id = ? AND fa.user_id = ?`,
    [
      data.financial_account_id,
      data.campaign_name,
      data.description || '',
      data.start_date || null,
      data.end_date || null,
      data.reward_rate ?? 0,
      data.reward_cap_amount ?? null,
      data.reward_cap_period ?? 0,
      data.min_spend_amount ?? null,
      JSON.stringify(data.applicable_days || []),
      JSON.stringify(data.target_merchants || []),
      data.requires_registration ? 1 : 0,
      data.is_quota_limited ? 1 : 0,
      data.requires_plan_switch ? 1 : 0,
      data.required_plan_name || null,
      id,
      userId
    ]
  );
  return res.affectedRows > 0;
}

async function remove(id, userId) {
  const [res] = await pool.query(
    `DELETE rc FROM reward_campaigns rc
       JOIN financial_accounts fa ON fa.id = rc.financial_account_id
      WHERE rc.id = ? AND fa.user_id = ?`,
    [id, userId]
  );
  return res.affectedRows > 0;
}

/**
 * Minimal projection for AI prompts:
 *   - drops created_at and verbose descriptions when not needed
 *   - only returns rows active on the target date
 */
async function listActiveForPrompt(userId, today) {
  const [rows] = await pool.query(
    `SELECT rc.id, rc.financial_account_id, rc.campaign_name,
            rc.start_date, rc.end_date, rc.reward_rate, rc.reward_cap_amount,
            rc.reward_cap_period, rc.min_spend_amount, rc.applicable_days,
            rc.target_merchants, rc.requires_registration, rc.is_quota_limited,
            rc.requires_plan_switch, rc.required_plan_name
       FROM reward_campaigns rc
       JOIN financial_accounts fa ON fa.id = rc.financial_account_id
      WHERE fa.user_id = ?
        AND (rc.start_date IS NULL OR rc.start_date <= ?)
        AND (rc.end_date   IS NULL OR rc.end_date   >= ?)`,
    [userId, today, today]
  );
  return rows.map(normalizeRow);
}

module.exports = { listByUser, listByAccount, findById, create, update, remove, listActiveForPrompt };
