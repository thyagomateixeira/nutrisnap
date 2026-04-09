const pool = require('../config/database');

const getCalendar = async (req, res) => {
  const { month, year } = req.query;
  try {
    const meals = await pool.query(
      `SELECT DATE(eaten_at) as date,
              SUM(calories) as total_calories,
              SUM(protein_g) as total_protein,
              SUM(carbs_g) as total_carbs,
              SUM(fat_g) as total_fat,
              COUNT(*) as meal_count
       FROM meals
       WHERE user_id=$1
         AND EXTRACT(MONTH FROM eaten_at)=$2
         AND EXTRACT(YEAR FROM eaten_at)=$3
       GROUP BY DATE(eaten_at)
       ORDER BY date ASC`,
      [req.userId, month, year]
    );

    const water = await pool.query(
      `SELECT DATE(logged_at) as date, SUM(amount_ml) as total_ml
       FROM water_logs
       WHERE user_id=$1
         AND EXTRACT(MONTH FROM logged_at)=$2
         AND EXTRACT(YEAR FROM logged_at)=$3
       GROUP BY DATE(logged_at)`,
      [req.userId, month, year]
    );

    res.json({ meals: meals.rows, water: water.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

module.exports = { getCalendar };
