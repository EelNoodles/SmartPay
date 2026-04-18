const path = require('path');
const fs = require('fs');
const FinancialAccount = require('../models/FinancialAccount');
const RewardCampaign   = require('../models/RewardCampaign');
const {
  ACCOUNT_TYPE,
  ACCOUNT_TYPE_META,
  ACCOUNT_TYPE_OPTIONS
} = require('../constants/accountTypes');

const BASE_PATH = process.env.BASE_PATH || '';
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'accounts');

exports.list = async (req, res, next) => {
  try {
    const accounts = await FinancialAccount.listByUser(req.session.user.id);
    const grouped = {};
    for (const v of Object.values(ACCOUNT_TYPE)) grouped[v] = [];
    for (const a of accounts) grouped[a.account_type].push(a);

    res.render('accounts/index', {
      title: '金融工具',
      activeNav: 'accounts',
      grouped,
      ACCOUNT_TYPE,
      ACCOUNT_TYPE_META
    });
  } catch (err) {
    next(err);
  }
};

exports.showCreate = (req, res) => {
  res.render('accounts/form', {
    title: '新增金融工具',
    activeNav: 'accounts',
    account: null,
    ACCOUNT_TYPE_OPTIONS
  });
};

exports.create = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const body = req.body;
    const imagePath = req.file ? `/uploads/accounts/${req.file.filename}` : null;

    const accountType = parseInt(body.account_type, 10);
    if (!Object.values(ACCOUNT_TYPE).includes(accountType)) {
      req.flash('error', '無效的帳戶類型');
      return res.redirect(`${BASE_PATH}/accounts/new`);
    }

    await FinancialAccount.create(userId, {
      account_type: accountType,
      bank_or_provider_name: String(body.bank_or_provider_name || '').trim(),
      card_or_account_name:  String(body.card_or_account_name  || '').trim(),
      last_four_digits:      String(body.last_four_digits      || '').replace(/\D/g, '').slice(-4) || null,
      image_path: imagePath
    });
    req.flash('success', '已新增金融工具');
    res.redirect(`${BASE_PATH}/accounts`);
  } catch (err) {
    next(err);
  }
};

exports.showEdit = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const account = await FinancialAccount.findById(id, req.session.user.id);
    if (!account) {
      req.flash('error', '找不到帳戶');
      return res.redirect(`${BASE_PATH}/accounts`);
    }
    res.render('accounts/form', {
      title: '編輯金融工具',
      activeNav: 'accounts',
      account,
      ACCOUNT_TYPE_OPTIONS
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.session.user.id;
    const body = req.body;
    const existing = await FinancialAccount.findById(id, userId);
    if (!existing) {
      req.flash('error', '找不到帳戶');
      return res.redirect(`${BASE_PATH}/accounts`);
    }

    const patch = {
      account_type: parseInt(body.account_type, 10),
      bank_or_provider_name: String(body.bank_or_provider_name || '').trim(),
      card_or_account_name:  String(body.card_or_account_name  || '').trim(),
      last_four_digits:      String(body.last_four_digits      || '').replace(/\D/g, '').slice(-4) || null
    };
    if (req.file) {
      patch.image_path = `/uploads/accounts/${req.file.filename}`;
      if (existing.image_path) {
        const oldFile = path.join(UPLOAD_DIR, path.basename(existing.image_path));
        fs.promises.unlink(oldFile).catch(() => {});
      }
    }
    await FinancialAccount.update(id, userId, patch);
    req.flash('success', '已更新');
    res.redirect(`${BASE_PATH}/accounts`);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.session.user.id;
    const existing = await FinancialAccount.findById(id, userId);
    if (existing?.image_path) {
      const oldFile = path.join(UPLOAD_DIR, path.basename(existing.image_path));
      fs.promises.unlink(oldFile).catch(() => {});
    }
    await FinancialAccount.remove(id, userId);
    req.flash('success', '已刪除');
    res.redirect(`${BASE_PATH}/accounts`);
  } catch (err) {
    next(err);
  }
};

exports.showDetail = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.session.user.id;
    const [account, campaigns] = await Promise.all([
      FinancialAccount.findById(id, userId),
      RewardCampaign.listByAccount(id, userId)
    ]);
    if (!account) {
      req.flash('error', '找不到帳戶');
      return res.redirect(`${BASE_PATH}/accounts`);
    }
    res.render('accounts/detail', {
      title: account.card_or_account_name,
      activeNav: 'accounts',
      account,
      campaigns,
      ACCOUNT_TYPE_META
    });
  } catch (err) {
    next(err);
  }
};
