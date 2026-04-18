const bcrypt = require('bcrypt');
const User = require('../models/User');

const BASE_PATH = process.env.BASE_PATH || '';
const REGISTER_PIN = String(process.env.REGISTER_PIN || '910618');

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;

exports.showLogin = (req, res) => {
  if (req.session.user) return res.redirect(`${BASE_PATH}/`);
  res.render('auth/login', {
    title: '登入 SmartPay',
    activeNav: 'login',
    form: { username: '' }
  });
};

exports.login = async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    const user = await User.findByUsername(username);
    if (!user) {
      req.flash('error', '帳號或密碼錯誤');
      return res.redirect(`${BASE_PATH}/auth/login`);
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      req.flash('error', '帳號或密碼錯誤');
      return res.redirect(`${BASE_PATH}/auth/login`);
    }
    req.session.user = {
      id: user.id,
      username: user.username,
      display_name: user.display_name
    };
    req.flash('success', `歡迎回來，${user.display_name || user.username}`);
    res.redirect(`${BASE_PATH}/`);
  } catch (err) {
    next(err);
  }
};

exports.showRegister = (req, res) => {
  if (req.session.user) return res.redirect(`${BASE_PATH}/`);
  const form = req.session.regForm || { username: '', display_name: '' };
  delete req.session.regForm;
  res.render('auth/register', {
    title: '註冊 SmartPay',
    activeNav: 'register',
    form
  });
};

exports.register = async (req, res, next) => {
  try {
    const username     = String(req.body.username     || '').trim();
    const displayName  = String(req.body.display_name || '').trim();
    const password     = String(req.body.password     || '');
    const passwordConf = String(req.body.password_confirm || '');
    const pin          = String(req.body.pin || '').trim();

    const back = (msg) => {
      req.flash('error', msg);
      // preserve typed values via session flash
      req.session.regForm = { username, display_name: displayName };
      res.redirect(`${BASE_PATH}/auth/register`);
    };

    if (pin !== REGISTER_PIN)            return back('PIN 碼錯誤，無法註冊');
    if (!USERNAME_RE.test(username))     return back('帳號需 3~32 字，限英數 . _ -');
    if (password.length < 8)             return back('密碼至少 8 碼');
    if (password !== passwordConf)       return back('兩次密碼輸入不一致');
    if (displayName.length > 64)         return back('顯示名稱過長');

    const exists = await User.findByUsername(username);
    if (exists) return back('此帳號已被使用');

    const passwordHash = await bcrypt.hash(password, 10);
    const id = await User.create({ username, passwordHash, displayName });

    req.session.user = {
      id,
      username,
      display_name: displayName || null
    };
    req.flash('success', `註冊成功，歡迎 ${displayName || username}`);
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
