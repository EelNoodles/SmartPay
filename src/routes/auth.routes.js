const express = require('express');
const ctrl = require('../controllers/auth.controller');

const router = express.Router();

router.get('/login', ctrl.showLogin);
router.post('/login', ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/logout', ctrl.logout);

module.exports = router;
