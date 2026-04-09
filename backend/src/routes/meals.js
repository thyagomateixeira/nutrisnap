const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMeals, createMeal, updateMeal, deleteMeal } = require('../controllers/mealsController');

router.get('/', auth, getMeals);
router.post('/', auth, createMeal);
router.put('/:id', auth, updateMeal);
router.delete('/:id', auth, deleteMeal);

module.exports = router;
