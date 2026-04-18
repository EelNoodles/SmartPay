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

exports.create = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const accountId = parseInt(req.body.financial_account_id, 10);

    // ownership check
    const account = await FinancialAccount.findById(accountId, userId);
    if (!account) {
      req.flash('error', '選擇的金融工具不存在');
      return res.redirect(`${BASE_PATH}/campaigns/new`);
    }

    const applicable_days = Array.isArray(req.body.applicable_days)
      ? req.body.applicable_days.map((n) => parseInt(n, 10)).filter(Boolean)
      : [];
    const target_merchants = String(req.body.target_merchants || '')
      .split(/[\n,，]/)
      .map((s) => s.trim())
      .filter(Boolean);

    await RewardCampaign.create({
      financial_account_id: accountId,
      campaign_name: String(req.body.campaign_name || '').trim() || '未命名活動',
      description: String(req.body.description || '').slice(0, 4000),
      start_date: req.body.start_date || null,
      end_date:   req.body.end_date   || null,
      reward_rate: Number(req.body.reward_rate || 0),
      reward_cap_amount: req.body.reward_cap_amount === '' ? null : Number(req.body.reward_cap_amount),
      reward_cap_period: parseInt(req.body.reward_cap_period, 10) || REWARD_CAP_PERIOD.NONE,
      min_spend_amount:  req.body.min_spend_amount === '' ? null : Number(req.body.min_spend_amount),
      applicable_days,
      target_merchants,
      requires_registration: req.body.requires_registration === 'on' || req.body.requires_registration === 'true',
      is_quota_limited:      req.body.is_quota_limited      === 'on' || req.body.is_quota_limited      === 'true'
    });
    req.flash('success', '已新增回饋活動');
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
