const pool = require('../config/db');

// GET /api/workouts?sort=workout_date&order=desc&type=Running
async function getWorkouts(req, res, next) {
  try {
    const userId = req.user.id;
    const { type, sort = 'workout_date', order = 'DESC' } = req.query;

    const allowed = ['workout_date', 'type', 'duration_min', 'calories', 'created_at'];
    const sortCol = allowed.includes(sort) ? sort : 'workout_date';
    const sortDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let sql = 'SELECT * FROM workouts WHERE user_id = ?';
    const params = [userId];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    sql += ` ORDER BY ${sortCol} ${sortDir}`;

    const [rows] = await pool.query(sql, params);
    res.json({ workouts: rows });
  } catch (err) { next(err); }
}

// GET /api/workouts/:id
async function getWorkout(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM workouts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Workout not found' });
    res.json({ workout: rows[0] });
  } catch (err) { next(err); }
}

// POST /api/workouts
async function createWorkout(req, res, next) {
  try {
    const { workout_date, type, duration_min, calories, distance_km, notes } = req.body;
    const [result] = await pool.query(
      `INSERT INTO workouts (user_id, workout_date, type, duration_min, calories, distance_km, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, workout_date, type, duration_min, calories || null, distance_km || null, notes || null]
    );
    const [rows] = await pool.query('SELECT * FROM workouts WHERE id = ?', [result.insertId]);
    res.status(201).json({ workout: rows[0] });
  } catch (err) { next(err); }
}

// PUT /api/workouts/:id
async function updateWorkout(req, res, next) {
  try {
    const { workout_date, type, duration_min, calories, distance_km, notes } = req.body;
    const [check] = await pool.query(
      'SELECT id FROM workouts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!check.length) return res.status(404).json({ error: 'Workout not found' });

    await pool.query(
      `UPDATE workouts SET workout_date=?, type=?, duration_min=?, calories=?, distance_km=?, notes=?
       WHERE id = ? AND user_id = ?`,
      [workout_date, type, duration_min, calories || null, distance_km || null, notes || null,
       req.params.id, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM workouts WHERE id = ?', [req.params.id]);
    res.json({ workout: rows[0] });
  } catch (err) { next(err); }
}

// DELETE /api/workouts/:id
async function deleteWorkout(req, res, next) {
  try {
    const [check] = await pool.query(
      'SELECT id FROM workouts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!check.length) return res.status(404).json({ error: 'Workout not found' });
    await pool.query('DELETE FROM workouts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Workout deleted' });
  } catch (err) { next(err); }
}

module.exports = { getWorkouts, getWorkout, createWorkout, updateWorkout, deleteWorkout };
