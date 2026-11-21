const pool = require('../config/db');

// GET /api/measurements
async function getMeasurements(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM body_measurements WHERE user_id = ? ORDER BY measured_at DESC',
      [req.user.id]
    );
    res.json({ measurements: rows });
  } catch (err) { next(err); }
}

// POST /api/measurements
async function createMeasurement(req, res, next) {
  try {
    const { measured_at, weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm, notes } = req.body;
    if (!measured_at) return res.status(400).json({ error: 'measured_at (date) is required' });

    // Date validation: not before 1900, not in the future
    const d = new Date(measured_at);
    if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid date' });
    if (d < new Date('1900-01-01')) return res.status(400).json({ error: 'Date cannot be before 1900' });
    if (d > new Date()) return res.status(400).json({ error: 'Date cannot be in the future' });

    if (weight_kg !== undefined && weight_kg !== null && (weight_kg <= 0 || weight_kg > 700))
      return res.status(400).json({ error: 'weight_kg must be between 0 and 700' });

    const [result] = await pool.query(
      `INSERT INTO body_measurements
       (user_id, measured_at, weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, measured_at,
       weight_kg || null, body_fat_pct || null,
       chest_cm || null, waist_cm || null, hips_cm || null,
       notes || null]
    );
    const [[row]] = await pool.query('SELECT * FROM body_measurements WHERE id = ?', [result.insertId]);
    res.status(201).json({ measurement: row });
  } catch (err) { next(err); }
}

// DELETE /api/measurements/:id
async function deleteMeasurement(req, res, next) {
  try {
    const [check] = await pool.query(
      'SELECT id FROM body_measurements WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!check.length) return res.status(404).json({ error: 'Measurement not found' });
    await pool.query('DELETE FROM body_measurements WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
}

module.exports = { getMeasurements, createMeasurement, deleteMeasurement };
