const express = require('express');
const ctrl = require('../controllers/recommender.controller');

const router = express.Router();

router.get('/',  ctrl.showForm);
router.post('/', ctrl.recommend);
router.post('/api', ctrl.recommendApi);

module.exports = router;
