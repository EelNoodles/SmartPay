const express = require('express');
const ctrl = require('../controllers/recommender.controller');

const router = express.Router();

router.get('/',  ctrl.showForm);
router.post('/', ctrl.recommend);

module.exports = router;
