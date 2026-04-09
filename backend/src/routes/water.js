const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getWater, addWater, deleteWater } = require('../controllers/waterController');

router.get('/', auth, getWater);
router.post('/', auth, addWater);
router.delete('/:id', auth, deleteWater);

module.exports = router;
