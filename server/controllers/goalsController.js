const pool = require('../config/db');

// Auto-calculate current_value from workouts for specific goal types
async function computeCurrentValue(userId, goalType) {
  const map = {
    workouts_count: 'SELECT COUNT(*) AS v FROM workouts WHERE user_id = ?',
    duration_min:   'SELECT COALESCE(SUM(duration_min),0) AS v FROM workouts WHERE user_id = ?',
    calories:       'SELECT COALESCE(SUM(calories),0) AS v FROM workouts WHERE user_id = ?',
    distance_km:    'SELECT COALESCE(SUM(distance_km),0) AS v FROM workouts WHERE user_id = ?',
  };
  const sql = map[goalType];
  if (!sql) return null; // custom/weight — not auto-computed
  const [[row]] = await pool.query(sql, [userId]);
  return Number(row.v);
}

// GET /api/goals
async function getGoals(req, res, next) {
  try {
    const [goals] = await pool.query(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    // Enrich computed goals with live current_value
    const enriched = await Promise.all(goals.map(async (g) => {
      const computed = await computeCurrentValue(req.user.id, g.goal_type);
      if (computed !== null) {
        return { ...g, current_value: computed, is_completed: computed >= g.target_value ? 1 : 0 };
      }
      return g;
    }));
    res.json({ goals: enriched });
  } catch (err) { next(err); }
}

// GET /api/goals/:id
async function getGoal(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Goal not found' });
    res.json({ goal: rows[0] });
  } catch (err) { next(err); }
}

// POST /api/goals
async function createGoal(req, res, next) {
  try {
    const { title, description, goal_type, target_value, current_value, unit, deadline } = req.body;
    const [result] = await pool.query(
      `INSERT INTO goals (user_id, title, description, goal_type, target_value, current_value, unit, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, description || null, goal_type || 'custom',
       target_value, current_value || 0, unit || null, deadline || null]
    );
    const [rows] = await pool.query('SELECT * FROM goals WHERE id = ?', [result.insertId]);
    res.status(201).json({ goal: rows[0] });
  } catch (err) { next(err); }
}

// PUT /api/goals/:id
async function updateGoal(req, res, next) {
  try {
    const [check] = await pool.query(
      'SELECT id FROM goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!check.length) return res.status(404).json({ error: 'Goal not found' });

    const { title, description, goal_type, target_value, current_value, unit, deadline, is_completed } = req.body;
    await pool.query(
      `UPDATE goals SET title=?, description=?, goal_type=?, target_value=?, current_value=?,
       unit=?, deadline=?, is_completed=? WHERE id = ? AND user_id = ?`,
      [title, description || null, goal_type || 'custom', target_value,
       current_value ?? 0, unit || null, deadline || null, is_completed ? 1 : 0,
       req.params.id, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM goals WHERE id = ?', [req.params.id]);
    res.json({ goal: rows[0] });
  } catch (err) { next(err); }
}

// DELETE /api/goals/:id
async function deleteGoal(req, res, next) {
  try {
    const [check] = await pool.query(
      'SELECT id FROM goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!check.length) return res.status(404).json({ error: 'Goal not found' });
    await pool.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Goal deleted' });
  } catch (err) { next(err); }
}

module.exports = { getGoals, getGoal, createGoal, updateGoal, deleteGoal };
