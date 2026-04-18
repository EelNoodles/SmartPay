const FinancialAccount = require('../models/FinancialAccount');
const { buildRecommendations } = require('../services/recommender.service');
const { ACCOUNT_TYPE_META } = require('../constants/accountTypes');

const AI_TIMEOUT_MS = 60_000; // 60 秒 AI 超時

exports.showForm = async (req, res, next) => {
  try {
    const accounts = await FinancialAccount.listByUser(req.session.user.id);
    res.render('recommender/index', {
      title: 'AI 最佳支付推薦',
      activeNav: 'recommender',
      accounts,
      ACCOUNT_TYPE_META,
      result: null,
      query: { scenario: '', amount: '' }
    });
  } catch (err) {
    next(err);
  }
};

exports.recommend = async (req, res, next) => {
  try {
    const scenario = String(req.body.scenario || '').trim();
    const amount   = Number(req.body.amount || 0);

    if (!scenario || !amount || amount <= 0) {
      const accounts = await FinancialAccount.listByUser(req.session.user.id);
      return res.status(400).render('recommender/index', {
        title: 'AI 最佳支付推薦',
        activeNav: 'recommender',
        accounts,
        ACCOUNT_TYPE_META,
        result: { error: '請輸入消費情境與有效金額' },
        query: { scenario, amount }
      });
    }

    const [accounts, ai] = await Promise.all([
      FinancialAccount.listByUser(req.session.user.id),
      buildRecommendations({
        userId: req.session.user.id,
        scenario,
        amount
      })
    ]);

    // Enrich each rec with the account object so the view can render cards.
    const accountById = new Map(accounts.map((a) => [a.id, a]));
    const enriched = ai.recommendations.map((r) => ({
      ...r,
      account: accountById.get(r.account_id) || null
    }));

    res.render('recommender/index', {
      title: 'AI 最佳支付推薦',
      activeNav: 'recommender',
      accounts,
      ACCOUNT_TYPE_META,
      result: { recommendations: enriched, context: ai.context },
      query: { scenario, amount }
    });
  } catch (err) {
    console.error('[SmartPay] recommend error:', err.message);
    let accounts = [];
    try { accounts = await FinancialAccount.listByUser(req.session.user.id); } catch (_) {}
    res.status(500).render('recommender/index', {
      title: 'AI 最佳支付推薦',
      activeNav: 'recommender',
      accounts,
      ACCOUNT_TYPE_META,
      result: { error: err.message || 'AI 推薦暫時無法使用' },
      query: { scenario: req.body.scenario || '', amount: req.body.amount || '' }
    });
  }
};

/**
 * POST /recommender/api  (JSON)
 * 供前端 fetch 呼叫，帶有 AI_TIMEOUT_MS 超時保護。
 */
exports.recommendApi = async (req, res) => {
  const scenario = String(req.body.scenario || '').trim();
  const amount   = Number(req.body.amount || 0);

  if (!scenario || !amount || amount <= 0) {
    return res.status(400).json({ error: '請輸入消費情境與有效金額' });
  }

  // 30 秒 AbortController timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const [accounts, ai] = await Promise.all([
      FinancialAccount.listByUser(req.session.user.id),
      buildRecommendations(
        { userId: req.session.user.id, scenario, amount },
        controller.signal
      )
    ]);

    clearTimeout(timer);

    const accountById = new Map(accounts.map((a) => [a.id, a]));
    const enriched = ai.recommendations.map((r) => ({
      ...r,
      account: accountById.get(r.account_id) || null
    }));

    return res.json({
      recommendations: enriched,
      context: ai.context
    });
  } catch (err) {
    clearTimeout(timer);
    console.error('[SmartPay] recommendApi error:', err.message);

    const isTimeout = err.name === 'AbortError' || err.message?.includes('abort');
    const status = isTimeout ? 504 : 500;
    const message = isTimeout
      ? 'AI 回應超時（超過 60 秒），請稍後再試。'
      : (err.message || 'AI 推薦暫時無法使用');

    return res.status(status).json({ error: message });
  }
};
