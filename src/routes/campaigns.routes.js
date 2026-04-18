const express = require('express');
const ctrl = require('../controllers/campaigns.controller');

const router = express.Router();

router.get('/',      ctrl.list);
router.get('/new',   ctrl.showCreate);
router.post('/parse', ctrl.parse);
router.post('/',     ctrl.create);
router.post('/:id/delete', ctrl.remove);

module.exports = router;
