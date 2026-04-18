const FinancialAccount = require('../models/FinancialAccount');
const RewardCampaign   = require('../models/RewardCampaign');
const { ACCOUNT_TYPE, ACCOUNT_TYPE_META } = require('../constants/accountTypes');

exports.showHome = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const [accounts, campaigns] = await Promise.all([
      FinancialAccount.listByUser(userId),
      RewardCampaign.listByUser(userId)
    ]);

    const countsByType = {};
    for (const v of Object.values(ACCOUNT_TYPE)) countsByType[v] = 0;
    for (const a of accounts) countsByType[a.account_type] += 1;

    res.render('home', {
      title: 'SmartPay 智能支付管家',
      activeNav: 'recommender',
      accounts,
      campaigns,
      countsByType,
      ACCOUNT_TYPE,
      ACCOUNT_TYPE_META
    });
  } catch (err) {
    next(err);
  }
};
