const BASE_PATH = process.env.BASE_PATH || '';

function attachUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  next();
}

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  if (req.accepts('html')) {
    return res.redirect(`${BASE_PATH}/auth/login`);
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { attachUser, requireAuth };
