const pool = require('../config/database');

const getWater = async (req, res) => {
  const { date } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM water_logs WHERE user_id=$1 AND DATE(logged_at)=$2 ORDER BY logged_at ASC`,
      [req.userId, date]
    );
    const total = result.rows.reduce((sum, r) => sum + r.amount_ml, 0);
    res.json({ logs: result.rows, total_ml: total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

const addWater = async (req, res) => {
  const { amount_ml } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO water_logs (user_id, amount_ml) VALUES ($1,$2) RETURNING *',
      [req.userId, amount_ml]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

const deleteWater = async (req, res) => {
  try {
    await pool.query('DELETE FROM water_logs WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ message: 'Registro removido' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

module.exports = { getWater, addWater, deleteWater };
