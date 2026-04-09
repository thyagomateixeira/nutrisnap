const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { analyzeMeal } = require('../controllers/analyzeController');

router.post('/', auth, analyzeMeal);

module.exports = router;
