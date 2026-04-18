const bcrypt = require('bcrypt');
const User = require('../models/User');

const BASE_PATH = process.env.BASE_PATH || '';

exports.showLogin = (req, res) => {
  if (req.session.user) return res.redirect(`${BASE_PATH}/`);
  res.render('auth/login', {
    title: '登入 SmartPay',
    activeNav: 'login'
  });
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findByUsername(String(username || '').trim());
    if (!user) {
      req.flash('error', '帳號或密碼錯誤');
      return res.redirect(`${BASE_PATH}/auth/login`);
    }
    const ok = await bcrypt.compare(String(password || ''), user.password_hash);
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

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect(`${BASE_PATH}/auth/login`);
  });
};
