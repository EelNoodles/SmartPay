const FinancialAccount = require('../models/FinancialAccount');
const RewardCampaign   = require('../models/RewardCampaign');
const { parseCampaignRules } = require('../services/campaignParser.service');
const {
  REWARD_CAP_PERIOD,
  REWARD_CAP_PERIOD_META,
  REWARD_CAP_PERIOD_OPTIONS
} = require('../constants/rewardCapPeriods');
const { WEEKDAYS } = require('../constants/weekdays');

const BASE_PATH = process.env.BASE_PATH || '';

exports.list = async (req, res, next) => {
  try {
    const campaigns = await RewardCampaign.listByUser(req.session.user.id);
    res.render('campaigns/index', {
      title: '回饋活動',
      activeNav: 'campaigns',
      campaigns,
      REWARD_CAP_PERIOD_META,
      WEEKDAYS
    });
  } catch (err) {
    next(err);
  }
};

exports.showCreate = async (req, res, next) => {
  try {
    const accounts = await FinancialAccount.listByUser(req.session.user.id);
    res.render('campaigns/form', {
      title: 'AI 智能登錄活動',
      activeNav: 'campaigns',
      accounts,
      campaign: null,
      parsed: null,
      rawText: '',
      REWARD_CAP_PERIOD_OPTIONS,
      WEEKDAYS
    });
  } catch (err) {
    next(err);
  }
};

exports.showEdit = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const id = parseInt(req.params.id, 10);
    const campaign = await RewardCampaign.findById(id, userId);
    if (!campaign) {
      req.flash('error', '活動不存在或已被刪除');
      return res.redirect(`${BASE_PATH}/campaigns`);
    }
    const accounts = await FinancialAccount.listByUser(userId);
    res.render('campaigns/form', {
      title: '編輯回饋活動',
      activeNav: 'campaigns',
      accounts,
      campaign,
      parsed: null,
      rawText: '',
      REWARD_CAP_PERIOD_OPTIONS,
      WEEKDAYS
    });
  } catch (err) {
    next(err);
  }
};

// POST /campaigns/parse  -> runs Gemini, returns JSON preview (no DB write)
exports.parse = async (req, res, next) => {
  try {
    const rawText = String(req.body.raw_text || '').trim();
    if (rawText.length < 10) {
      return res.status(400).json({ error: '活動規則文字太短' });
    }
    const parsed = await parseCampaignRules(rawText);
    res.json({ parsed });
  } catch (err) {
    console.error('[SmartPay] parseCampaignRules error:', err.message);
    res.status(500).json({ error: err.message || 'AI 解析失敗' });
  }
};

function buildCampaignPayload(body, accountId) {
  const applicable_days = Array.isArray(body.applicable_days)
    ? body.applicable_days.map((n) => parseInt(n, 10)).filter(Boolean)
    : [];
  const target_merchants = String(body.target_merchants || '')
    .split(/[\n,，]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const requiresPlanSwitch =
    body.requires_plan_switch === 'on' || body.requires_plan_switch === 'true';
  const requiredPlanNameRaw = String(body.required_plan_name || '').trim();

  return {
    financial_account_id: accountId,
    campaign_name: String(body.campaign_name || '').trim() || '未命名活動',
    description: String(body.description || '').slice(0, 4000),
    start_date: body.start_date || null,
    end_date:   body.end_date   || null,
    reward_rate: Number(body.reward_rate || 0),
    reward_cap_amount: body.reward_cap_amount === '' ? null : Number(body.reward_cap_amount),
    reward_cap_period: parseInt(body.reward_cap_period, 10) || REWARD_CAP_PERIOD.NONE,
    min_spend_amount:  body.min_spend_amount === '' ? null : Number(body.min_spend_amount),
    applicable_days,
    target_merchants,
    requires_registration: body.requires_registration === 'on' || body.requires_registration === 'true',
    is_quota_limited:      body.is_quota_limited      === 'on' || body.is_quota_limited      === 'true',
    requires_plan_switch:  requiresPlanSwitch,
    required_plan_name:    requiresPlanSwitch ? (requiredPlanNameRaw.slice(0, 255) || null) : null
  };
}

exports.create = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const accountId = parseInt(req.body.financial_account_id, 10);

    const account = await FinancialAccount.findById(accountId, userId);
    if (!account) {
      req.flash('error', '選擇的金融工具不存在');
      return res.redirect(`${BASE_PATH}/campaigns/new`);
    }

    await RewardCampaign.create(buildCampaignPayload(req.body, accountId));
    req.flash('success', '已新增回饋活動');
    res.redirect(`${BASE_PATH}/campaigns`);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const id = parseInt(req.params.id, 10);
    const accountId = parseInt(req.body.financial_account_id, 10);

    const existing = await RewardCampaign.findById(id, userId);
    if (!existing) {
      req.flash('error', '活動不存在或已被刪除');
      return res.redirect(`${BASE_PATH}/campaigns`);
    }
    const account = await FinancialAccount.findById(accountId, userId);
    if (!account) {
      req.flash('error', '選擇的金融工具不存在');
      return res.redirect(`${BASE_PATH}/campaigns/${id}/edit`);
    }

    await RewardCampaign.update(id, userId, buildCampaignPayload(req.body, accountId));
    req.flash('success', '已更新回饋活動');
    res.redirect(`${BASE_PATH}/campaigns`);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await RewardCampaign.remove(id, req.session.user.id);
    req.flash('success', '已刪除活動');
    res.redirect(`${BASE_PATH}/campaigns`);
  } catch (err) {
    next(err);
  }
};
