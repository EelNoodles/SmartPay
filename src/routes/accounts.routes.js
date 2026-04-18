const express = require('express');
const upload = require('../middlewares/upload');
const ctrl = require('../controllers/accounts.controller');

const router = express.Router();

router.get('/',        ctrl.list);
router.get('/new',     ctrl.showCreate);
router.post('/',       upload.single('image'), ctrl.create);
router.get('/:id',     ctrl.showDetail);
router.get('/:id/edit', ctrl.showEdit);
router.post('/:id',    upload.single('image'), ctrl.update);
router.post('/:id/delete', ctrl.remove);

module.exports = router;
