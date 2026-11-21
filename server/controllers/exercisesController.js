const pool = require('../config/db');

const DEFAULT_EXERCISES = [
  { name:'Push-ups',      category:'Upper Body', muscle_group:'Chest, Triceps',   equipment:'None',      calories_per_min: 7 },
  { name:'Pull-ups',      category:'Upper Body', muscle_group:'Back, Biceps',     equipment:'Pull-up bar', calories_per_min: 8 },
  { name:'Dumbbell Press',category:'Upper Body', muscle_group:'Chest, Shoulders', equipment:'Dumbbells', calories_per_min: 6 },
  { name:'Shoulder Press',category:'Upper Body', muscle_group:'Shoulders',        equipment:'Dumbbells', calories_per_min: 6 },
  { name:'Bicep Curls',   category:'Upper Body', muscle_group:'Biceps',           equipment:'Dumbbells', calories_per_min: 5 },
  { name:'Tricep Dips',   category:'Upper Body', muscle_group:'Triceps',          equipment:'Bench',     calories_per_min: 6 },
  { name:'Squats',        category:'Lower Body', muscle_group:'Quads, Glutes',    equipment:'None',      calories_per_min: 8 },
  { name:'Lunges',        category:'Lower Body', muscle_group:'Quads, Glutes',    equipment:'None',      calories_per_min: 7 },
  { name:'Deadlift',      category:'Lower Body', muscle_group:'Hamstrings, Back', equipment:'Barbell',   calories_per_min: 9 },
  { name:'Leg Press',     category:'Lower Body', muscle_group:'Quads',            equipment:'Machine',   calories_per_min: 7 },
  { name:'Plank',         category:'Core',       muscle_group:'Core',             equipment:'None',      calories_per_min: 4 },
  { name:'Crunches',      category:'Core',       muscle_group:'Abs',              equipment:'None',      calories_per_min: 5 },
  { name:'Mountain Climbers', category:'Cardio', muscle_group:'Full Body',        equipment:'None',      calories_per_min:10 },
  { name:'Running',       category:'Cardio',     muscle_group:'Full Body',        equipment:'None',      calories_per_min:11 },
  { name:'Cycling',       category:'Cardio',     muscle_group:'Legs',             equipment:'Bike',      calories_per_min: 9 },
  { name:'Jump Rope',     category:'Cardio',     muscle_group:'Full Body',        equipment:'Jump rope', calories_per_min:12 },
  { name:'Burpees',       category:'HIIT',       muscle_group:'Full Body',        equipment:'None',      calories_per_min:11 },
  { name:'Box Jumps',     category:'HIIT',       muscle_group:'Legs, Core',       equipment:'Box',       calories_per_min:10 },
  { name:'Yoga - Sun Salutation', category:'Flexibility', muscle_group:'Full Body', equipment:'Mat',     calories_per_min: 4 },
  { name:'Foam Rolling',  category:'Recovery',   muscle_group:'Full Body',        equipment:'Foam roller', calories_per_min:2 },
];

// Seed defaults for a new user if they have none
async function seedDefaultsIfEmpty(userId) {
  const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM exercises WHERE user_id = ?', [userId]);
  if (rows[0].cnt > 0) return;
  const values = DEFAULT_EXERCISES.map(e => [userId, e.name, e.category, e.muscle_group, e.equipment, e.calories_per_min]);
  await pool.query(
    'INSERT INTO exercises (user_id, name, category, muscle_group, equipment, calories_per_min) VALUES ?',
    [values]
  );
}

async function getExercises(req, res, next) {
  try {
    await seedDefaultsIfEmpty(req.user.id);
    const { category } = req.query;
    let sql = 'SELECT * FROM exercises WHERE user_id = ?';
    const params = [req.user.id];
    if (category) { sql += ' AND category = ?'; params.push(category); }
    sql += ' ORDER BY category, name';
    const [rows] = await pool.query(sql, params);
    res.json({ exercises: rows });
  } catch (err) { next(err); }
}

async function createExercise(req, res, next) {
  try {
    const { name, category, muscle_group, equipment, instructions, calories_per_min } = req.body;
    const [result] = await pool.query(
      `INSERT INTO exercises (user_id, name, category, muscle_group, equipment, instructions, calories_per_min)
       VALUES (?,?,?,?,?,?,?)`,
      [req.user.id, name, category || 'General', muscle_group||null, equipment||null, instructions||null, calories_per_min||null]
    );
    const [rows] = await pool.query('SELECT * FROM exercises WHERE id = ?', [result.insertId]);
    res.status(201).json({ exercise: rows[0] });
  } catch (err) { next(err); }
}

async function deleteExercise(req, res, next) {
  try {
    const [check] = await pool.query('SELECT id FROM exercises WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!check.length) return res.status(404).json({ error: 'Exercise not found' });
    await pool.query('DELETE FROM exercises WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Exercise deleted' });
  } catch (err) { next(err); }
}

// POST /api/exercises/:id/log — logs an exercise as a workout entry
async function logExercise(req, res, next) {
  try {
    const { duration_min } = req.body;
    if (!duration_min || duration_min < 1) return res.status(400).json({ error: 'duration_min must be at least 1' });

    const [exRows] = await pool.query('SELECT * FROM exercises WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!exRows.length) return res.status(404).json({ error: 'Exercise not found' });

    const ex = exRows[0];
    const calories = ex.calories_per_min ? Math.round(ex.calories_per_min * duration_min) : null;
    const today = new Date().toISOString().slice(0, 10);

    const [result] = await pool.query(
      `INSERT INTO workouts (user_id, workout_date, type, duration_min, calories) VALUES (?,?,?,?,?)`,
      [req.user.id, today, ex.name, duration_min, calories]
    );
    const [rows] = await pool.query('SELECT * FROM workouts WHERE id = ?', [result.insertId]);
    res.status(201).json({ workout: rows[0], calories_burned: calories });
  } catch (err) { next(err); }
}

module.exports = { getExercises, createExercise, deleteExercise, logExercise };
