const bcrypt = require('bcrypt');
const User = require('../models/User');

const BASE_PATH = process.env.BASE_PATH || '';
const REGISTER_PIN = String(process.env.REGISTER_PIN || '910618');

// Pragmatic email regex: one @, at least one dot in the domain, no spaces.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 255;

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

exports.showLogin = (req, res) => {
  if (req.session.user) return res.redirect(`${BASE_PATH}/`);
  res.render('auth/login', {
    title: '登入 SmartPay',
    activeNav: 'login',
    form: { email: '' }
  });
};

exports.login = async (req, res, next) => {
  try {
    const email    = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    const user = await User.findByEmail(email);
    if (!user) {
      req.flash('error', '電子郵件或密碼錯誤');
      return res.redirect(`${BASE_PATH}/auth/login`);
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      req.flash('error', '電子郵件或密碼錯誤');
      return res.redirect(`${BASE_PATH}/auth/login`);
    }
    req.session.user = {
      id: user.id,
      email: user.email,
      display_name: user.display_name
    };
    req.flash('success', `歡迎回來，${user.display_name || user.email}`);
    res.redirect(`${BASE_PATH}/`);
  } catch (err) {
    next(err);
  }
};

exports.showRegister = (req, res) => {
  if (req.session.user) return res.redirect(`${BASE_PATH}/`);
  const form = req.session.regForm || { email: '', display_name: '' };
  delete req.session.regForm;
  res.render('auth/register', {
    title: '註冊 SmartPay',
    activeNav: 'register',
    form
  });
};

exports.register = async (req, res, next) => {
  try {
    const email        = normalizeEmail(req.body.email);
    const displayName  = String(req.body.display_name || '').trim();
    const password     = String(req.body.password || '');
    const passwordConf = String(req.body.password_confirm || '');
    const pin          = String(req.body.pin || '').trim();

    const back = (msg) => {
      req.flash('error', msg);
      req.session.regForm = { email, display_name: displayName };
      res.redirect(`${BASE_PATH}/auth/register`);
    };

    if (pin !== REGISTER_PIN)          return back('PIN 碼錯誤，無法註冊');
    if (!EMAIL_RE.test(email))         return back('電子郵件格式不正確');
    if (email.length > EMAIL_MAX)      return back('電子郵件過長');
    if (password.length < 8)           return back('密碼至少 8 碼');
    if (password !== passwordConf)     return back('兩次密碼輸入不一致');
    if (displayName.length > 64)       return back('顯示名稱過長');

    const exists = await User.findByEmail(email);
    if (exists) return back('此電子郵件已註冊');

    const passwordHash = await bcrypt.hash(password, 10);
    const id = await User.create({ email, passwordHash, displayName });

    req.session.user = {
      id,
      email,
      display_name: displayName || null
    };
    req.flash('success', `註冊成功，歡迎 ${displayName || email}`);
    res.redirect(`${BASE_PATH}/`);
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect(`${BASE_PATH}/auth/login`);
  });
};
