const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getCalendar } = require('../controllers/calendarController');

router.get('/', auth, getCalendar);

module.exports = router;
