const pool = require('../config/database');

const getProfile = async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1', [req.userId]
    );
    const profile = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1', [req.userId]
    );
    const goals = await pool.query(
      'SELECT * FROM user_goals WHERE user_id = $1', [req.userId]
    );
    res.json({
      user: user.rows[0],
      profile: profile.rows[0] || null,
      goals: goals.rows[0] || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

const updateProfile = async (req, res) => {
  const { name, weight_kg, height_cm, age, sex, activity_level, goals } = req.body;

  try {
    if (name) {
      await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, req.userId]);
    }

    if (weight_kg || height_cm || age || sex || activity_level) {
      const bmr = calcBMR(weight_kg, height_cm, age, sex, activity_level);
      await pool.query(`
        INSERT INTO user_profiles (user_id, weight_kg, height_cm, age, sex, activity_level, bmr_calories)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (user_id) DO UPDATE
        SET weight_kg=$2, height_cm=$3, age=$4, sex=$5, activity_level=$6, bmr_calories=$7, updated_at=NOW()
      `, [req.userId, weight_kg, height_cm, age, sex, activity_level, bmr]);
    }

    if (goals) {
      await pool.query(`
        INSERT INTO user_goals (user_id, calories, protein_g, carbs_g, fat_g, fiber_g, water_ml)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (user_id) DO UPDATE
        SET calories=$2, protein_g=$3, carbs_g=$4, fat_g=$5, fiber_g=$6, water_ml=$7
      `, [req.userId, goals.calories, goals.protein_g, goals.carbs_g, goals.fat_g, goals.fiber_g, goals.water_ml]);
    }

    res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

function calcBMR(weight, height, age, sex, activity) {
  if (!weight || !height || !age || !sex) return null;
  let bmr = sex === 'M'
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161;

  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  return Math.round(bmr * (multipliers[activity] || 1.2));
}

module.exports = { getProfile, updateProfile };
