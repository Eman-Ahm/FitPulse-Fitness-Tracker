const pool = require('../config/db');

// GET /api/water?date=YYYY-MM-DD
async function getWater(req, res, next) {
  try {
    const { date } = req.query;
    let sql = 'SELECT * FROM water_intake WHERE user_id = ?';
    const params = [req.user.id];
    if (date) { sql += ' AND logged_date = ?'; params.push(date); }
    sql += ' ORDER BY logged_date DESC, created_at DESC';

    const [rows] = await pool.query(sql, params);

    let dailyTotal = 0;
    if (date) {
      const [[t]] = await pool.query(
        'SELECT COALESCE(SUM(amount_ml), 0) AS total FROM water_intake WHERE user_id = ? AND logged_date = ?',
        [req.user.id, date]
      );
      dailyTotal = Number(t.total);
    }

    res.json({ entries: rows, dailyTotal });
  } catch (err) { next(err); }
}

// POST /api/water
async function logWater(req, res, next) {
  try {
    const { logged_date, amount_ml } = req.body;
    if (!logged_date) return res.status(400).json({ error: 'logged_date is required' });
    if (!amount_ml || amount_ml < 1) return res.status(400).json({ error: 'amount_ml must be positive' });
    if (amount_ml > 5000) return res.status(400).json({ error: 'amount_ml must be ≤ 5000 ml per entry' });

    const d = new Date(logged_date);
    if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid date' });
    if (d < new Date('1900-01-01')) return res.status(400).json({ error: 'Date cannot be before 1900' });
    if (d > new Date()) return res.status(400).json({ error: 'Date cannot be in the future' });

    const [result] = await pool.query(
      'INSERT INTO water_intake (user_id, logged_date, amount_ml) VALUES (?, ?, ?)',
      [req.user.id, logged_date, amount_ml]
    );
    const [[row]] = await pool.query('SELECT * FROM water_intake WHERE id = ?', [result.insertId]);
    res.status(201).json({ entry: row });
  } catch (err) { next(err); }
}

// DELETE /api/water/:id
async function deleteWater(req, res, next) {
  try {
    const [check] = await pool.query(
      'SELECT id FROM water_intake WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!check.length) return res.status(404).json({ error: 'Entry not found' });
    await pool.query('DELETE FROM water_intake WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
}

module.exports = { getWater, logWater, deleteWater };
