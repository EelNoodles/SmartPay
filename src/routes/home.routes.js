const express = require('express');
const ctrl = require('../controllers/home.controller');

const router = express.Router();

router.get('/', ctrl.showHome);

module.exports = router;
