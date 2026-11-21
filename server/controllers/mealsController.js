const pool = require('../config/db');

// GET /api/meals?date=YYYY-MM-DD
async function getMeals(req, res, next) {
  try {
    const { date } = req.query;
    let sql = 'SELECT * FROM meals WHERE user_id = ?';
    const params = [req.user.id];
    if (date) { sql += ' AND meal_date = ?'; params.push(date); }
    sql += ' ORDER BY meal_date DESC, FIELD(meal_type,"Breakfast","Lunch","Dinner","Snack"), created_at';
    const [rows] = await pool.query(sql, params);

    // Daily totals for requested date
    let dailyTotals = null;
    if (date) {
      const [[t]] = await pool.query(
        `SELECT COALESCE(SUM(calories),0) AS calories,
                COALESCE(SUM(protein_g),0) AS protein_g,
                COALESCE(SUM(carbs_g),0)   AS carbs_g,
                COALESCE(SUM(fat_g),0)     AS fat_g
         FROM meals WHERE user_id = ? AND meal_date = ?`,
        [req.user.id, date]
      );
      dailyTotals = { calories: +t.calories, protein_g: +t.protein_g, carbs_g: +t.carbs_g, fat_g: +t.fat_g };
    }

    res.json({ meals: rows, dailyTotals });
  } catch (err) { next(err); }
}

async function createMeal(req, res, next) {
  try {
    const { meal_date, meal_type, name, calories, protein_g, carbs_g, fat_g, notes } = req.body;
    if (!meal_date || !name || !calories) return res.status(400).json({ error: 'meal_date, name, and calories are required' });
    if (calories < 1) return res.status(400).json({ error: 'Calories must be positive' });

    const [result] = await pool.query(
      `INSERT INTO meals (user_id, meal_date, meal_type, name, calories, protein_g, carbs_g, fat_g, notes)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [req.user.id, meal_date, meal_type||'Snack', name, calories,
       protein_g||null, carbs_g||null, fat_g||null, notes||null]
    );
    const [rows] = await pool.query('SELECT * FROM meals WHERE id = ?', [result.insertId]);
    res.status(201).json({ meal: rows[0] });
  } catch (err) { next(err); }
}

async function updateMeal(req, res, next) {
  try {
    const [check] = await pool.query('SELECT id FROM meals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!check.length) return res.status(404).json({ error: 'Meal not found' });
    const { meal_date, meal_type, name, calories, protein_g, carbs_g, fat_g, notes } = req.body;
    await pool.query(
      `UPDATE meals SET meal_date=?, meal_type=?, name=?, calories=?, protein_g=?, carbs_g=?, fat_g=?, notes=?
       WHERE id = ? AND user_id = ?`,
      [meal_date, meal_type||'Snack', name, calories, protein_g||null, carbs_g||null, fat_g||null, notes||null,
       req.params.id, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM meals WHERE id = ?', [req.params.id]);
    res.json({ meal: rows[0] });
  } catch (err) { next(err); }
}

async function deleteMeal(req, res, next) {
  try {
    const [check] = await pool.query('SELECT id FROM meals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!check.length) return res.status(404).json({ error: 'Meal not found' });
    await pool.query('DELETE FROM meals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Meal deleted' });
  } catch (err) { next(err); }
}

module.exports = { getMeals, createMeal, updateMeal, deleteMeal };
