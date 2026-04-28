const pool = require('../config/database');

const getProfile = async (req, res) => {
  try {
    const user    = await pool.query('SELECT id, name, email FROM users WHERE id=$1', [req.userId]);
    const profile = await pool.query('SELECT * FROM user_profiles WHERE user_id=$1', [req.userId]);
    const goals   = await pool.query('SELECT * FROM user_goals WHERE user_id=$1', [req.userId]);
    res.json({
      user:    user.rows[0],
      profile: profile.rows[0] || null,
      goals:   goals.rows[0]   || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

const updateProfile = async (req, res) => {
  const { weight_kg, height_cm, age, gender, activity_level, goal, water_goal_ml, avatar_url } = req.body;

  try {
    // gender 'male'/'female' → sex 'M'/'F'
    const sex = gender === 'female' ? 'F' : 'M';
    const bmr = calcBMR(weight_kg, height_cm, age, sex, activity_level);

    // Salva perfil físico
    await pool.query(`
      INSERT INTO user_profiles (user_id, weight_kg, height_cm, age, sex, activity_level, bmr_calories, avatar_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (user_id) DO UPDATE
      SET weight_kg=$2, height_cm=$3, age=$4, sex=$5, activity_level=$6, bmr_calories=$7,
          avatar_url=COALESCE($8, user_profiles.avatar_url), updated_at=NOW()
    `, [req.userId, weight_kg, height_cm, age, sex, activity_level, bmr, avatar_url || null]);

    // Calcula metas automáticas a partir do BMR + objetivo
    if (bmr) {
      let calorieGoal = bmr;
      if (goal === 'lose') calorieGoal = Math.round(bmr * 0.85);
      if (goal === 'gain') calorieGoal = Math.round(bmr * 1.15);

      const proteinGoal = Math.round((weight_kg || 70) * 1.8);
      const fatGoal     = Math.round(calorieGoal * 0.25 / 9);
      const carbGoal    = Math.max(50, Math.round((calorieGoal - proteinGoal * 4 - fatGoal * 9) / 4));
      const fiberGoal   = 25;
      const waterGoal   = water_goal_ml || 2000;

      await pool.query(`
        INSERT INTO user_goals (user_id, calories, protein_g, carbs_g, fat_g, fiber_g, water_ml, goal)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (user_id) DO UPDATE
        SET calories=$2, protein_g=$3, carbs_g=$4, fat_g=$5, fiber_g=$6, water_ml=$7, goal=$8
      `, [req.userId, calorieGoal, proteinGoal, carbGoal, fatGoal, fiberGoal, waterGoal, goal || 'maintain']);
    } else if (water_goal_ml) {
      // Só atualiza água se não tiver BMR
      await pool.query(`
        INSERT INTO user_goals (user_id, water_ml, goal)
        VALUES ($1,$2,$3)
        ON CONFLICT (user_id) DO UPDATE SET water_ml=$2, goal=$3
      `, [req.userId, water_goal_ml, goal || 'maintain']);
    }

    res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

function calcBMR(weight, height, age, sex, activity) {
  if (!weight || !height || !age) return null;
  let bmr = sex === 'F'
    ? (10 * weight) + (6.25 * height) - (5 * age) - 161
    : (10 * weight) + (6.25 * height) - (5 * age) + 5;
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  return Math.round(bmr * (multipliers[activity] || 1.2));
}

module.exports = { getProfile, updateProfile };
