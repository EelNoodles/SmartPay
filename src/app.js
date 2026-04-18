const path = require('path');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');

const BASE_PATH = process.env.BASE_PATH || '';

const authRoutes        = require('./routes/auth.routes');
const accountsRoutes    = require('./routes/accounts.routes');
const campaignsRoutes   = require('./routes/campaigns.routes');
const recommenderRoutes = require('./routes/recommender.routes');
const homeRoutes        = require('./routes/home.routes');

const { attachUser, requireAuth } = require('./middlewares/auth');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(
  session({
    name: 'smartpay.sid',
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production'
    }
  })
);
app.use(flash());

// Expose template helpers & session user on every render
app.use((req, res, next) => {
  res.locals.BASE_PATH = BASE_PATH;
  res.locals.asset = (p) => `${BASE_PATH}${p.startsWith('/') ? '' : '/'}${p}`;
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = {
    success: req.flash('success'),
    error:   req.flash('error'),
    info:    req.flash('info')
  };
  res.locals.activeNav = '';
  next();
});

const router = express.Router();

router.use('/public', express.static(path.join(__dirname, '..', 'public'), { maxAge: '7d' }));
router.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

router.use('/auth', authRoutes);

router.use(attachUser);
router.use('/', requireAuth, homeRoutes);
router.use('/accounts',    requireAuth, accountsRoutes);
router.use('/campaigns',   requireAuth, campaignsRoutes);
router.use('/recommender', requireAuth, recommenderRoutes);

router.use((req, res) => {
  res.status(404).render('error', {
    title: 'Not Found',
    message: '找不到這個頁面'
  });
});

router.use((err, req, res, next) => {
  console.error('[SmartPay] error:', err);
  res.status(500).render('error', {
    title: 'Server Error',
    message: process.env.NODE_ENV === 'production' ? '伺服器發生錯誤' : err.message
  });
});

app.use(BASE_PATH || '/', router);

module.exports = app;
