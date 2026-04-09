const pool = require('../config/database');

const getMeals = async (req, res) => {
  const { date } = req.query;
  try {
    const result = await pool.query(
      `SELECT m.*, json_agg(mf.*) as foods
       FROM meals m
       LEFT JOIN meal_foods mf ON mf.meal_id = m.id
       WHERE m.user_id = $1 AND DATE(m.eaten_at) = $2
       GROUP BY m.id ORDER BY m.eaten_at ASC`,
      [req.userId, date]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

const createMeal = async (req, res) => {
  const { name, eaten_at, image_url, calories, protein_g, carbs_g, fat_g, fiber_g, foods } = req.body;
  try {
    const meal = await pool.query(
      `INSERT INTO meals (user_id, name, eaten_at, image_url, calories, protein_g, carbs_g, fat_g, fiber_g)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.userId, name, eaten_at, image_url, calories, protein_g, carbs_g, fat_g, fiber_g]
    );

    if (foods && foods.length > 0) {
      for (const food of foods) {
        await pool.query(
          'INSERT INTO meal_foods (meal_id, name, emoji, portion, calories) VALUES ($1,$2,$3,$4,$5)',
          [meal.rows[0].id, food.name, food.emoji, food.portion, food.calories]
        );
      }
    }

    res.status(201).json(meal.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

const updateMeal = async (req, res) => {
  const { name, calories, protein_g, carbs_g, fat_g, fiber_g } = req.body;
  try {
    const result = await pool.query(
      `UPDATE meals SET name=$1, calories=$2, protein_g=$3, carbs_g=$4, fat_g=$5, fiber_g=$6
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [name, calories, protein_g, carbs_g, fat_g, fiber_g, req.params.id, req.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

const deleteMeal = async (req, res) => {
  try {
    await pool.query('DELETE FROM meals WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ message: 'Refeição removida' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

module.exports = { getMeals, createMeal, updateMeal, deleteMeal };
