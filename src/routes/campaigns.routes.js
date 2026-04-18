const express = require('express');
const ctrl = require('../controllers/campaigns.controller');

const router = express.Router();

router.get('/',            ctrl.list);
router.get('/new',         ctrl.showCreate);
router.post('/parse',      ctrl.parse);
router.post('/',           ctrl.create);
router.get('/:id/edit',    ctrl.showEdit);
router.post('/:id',        ctrl.update);
router.post('/:id/delete', ctrl.remove);

module.exports = router;
