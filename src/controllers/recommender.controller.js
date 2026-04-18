const FinancialAccount = require('../models/FinancialAccount');
const { buildRecommendations } = require('../services/recommender.service');
const { ACCOUNT_TYPE_META } = require('../constants/accountTypes');

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
    const accounts = await FinancialAccount.listByUser(req.session.user.id);
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
