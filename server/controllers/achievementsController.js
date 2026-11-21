const pool = require('../config/db');

// All possible achievements with their unlock criteria
const ACHIEVEMENT_DEFS = [
  { key: 'first_workout',  title: 'First Steps',        description: 'Logged your very first workout',       icon: '🎉', check: async (uid, pool) => { const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM workouts WHERE user_id=?',[uid]); return r.c >= 1; } },
  { key: 'workout_5',      title: 'Getting Started',    description: 'Logged 5 workouts',                    icon: '💪', check: async (uid, pool) => { const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM workouts WHERE user_id=?',[uid]); return r.c >= 5; } },
  { key: 'workout_10',     title: 'Consistent',         description: 'Logged 10 workouts',                   icon: '🔥', check: async (uid, pool) => { const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM workouts WHERE user_id=?',[uid]); return r.c >= 10; } },
  { key: 'workout_25',     title: 'Dedicated',          description: 'Logged 25 workouts',                   icon: '⭐', check: async (uid, pool) => { const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM workouts WHERE user_id=?',[uid]); return r.c >= 25; } },
  { key: 'workout_50',     title: 'Elite Athlete',      description: 'Logged 50 workouts',                   icon: '🏅', check: async (uid, pool) => { const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM workouts WHERE user_id=?',[uid]); return r.c >= 50; } },
  { key: 'calories_1000',  title: 'Calorie Burner',     description: 'Burned 1,000 total calories',          icon: '🔥', check: async (uid, pool) => { const [[r]] = await pool.query('SELECT COALESCE(SUM(calories),0) AS c FROM workouts WHERE user_id=?',[uid]); return r.c >= 1000; } },
  { key: 'calories_5000',  title: 'Inferno',            description: 'Burned 5,000 total calories',          icon: '🌋', check: async (uid, pool) => { const [[r]] = await pool.query('SELECT COALESCE(SUM(calories),0) AS c FROM workouts WHERE user_id=?',[uid]); return r.c >= 5000; } },
  { key: 'distance_10',    title: 'Road Runner',        description: 'Covered 10 km total distance',         icon: '🏃', check: async (uid, pool) => { const [[r]] = await pool.query('SELECT COALESCE(SUM(distance_km),0) AS c FROM workouts WHERE user_id=?',[uid]); return r.c >= 10; } },
  { key: 'distance_42',    title: 'Marathon Spirit',    description: 'Covered 42 km total distance',         icon: '🎽', check: async (uid, pool) => { const [[r]] = await pool.query('SELECT COALESCE(SUM(distance_km),0) AS c FROM workouts WHERE user_id=?',[uid]); return r.c >= 42; } },
  { key: 'goal_complete',  title: 'Goal Crusher',       description: 'Completed your first goal',            icon: '🎯', check: async (uid, pool) => { const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM goals WHERE user_id=? AND is_completed=1',[uid]); return r.c >= 1; } },
  { key: 'meal_logged',    title: 'Nutrition Aware',    description: 'Logged your first meal',               icon: '🥗', check: async (uid, pool) => { const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM meals WHERE user_id=?',[uid]); return r.c >= 1; } },
  { key: 'streak_3',       title: '3-Day Streak',       description: 'Worked out 3 days in a row',          icon: '📅', check: async (uid, pool) => { return await checkStreak(uid, pool, 3); } },
  { key: 'streak_7',       title: 'Week Warrior',       description: 'Worked out 7 days in a row',          icon: '🗓️', check: async (uid, pool) => { return await checkStreak(uid, pool, 7); } },
  { key: 'duration_60',    title: 'Hour of Power',      description: 'A single workout over 60 minutes',    icon: '⏰', check: async (uid, pool) => { const [[r]] = await pool.query('SELECT MAX(duration_min) AS m FROM workouts WHERE user_id=?',[uid]); return r.m >= 60; } },
];

async function checkStreak(userId, pool, days) {
  const [rows] = await pool.query(
    'SELECT DISTINCT workout_date FROM workouts WHERE user_id = ? ORDER BY workout_date DESC LIMIT ?',
    [userId, days + 5]
  );
  if (rows.length < days) return false;
  let streak = 1;
  for (let i = 1; i < rows.length; i++) {
    const prev = new Date(rows[i-1].workout_date);
    const curr = new Date(rows[i].workout_date);
    const diff = (prev - curr) / 86400000;
    if (diff === 1) { streak++; if (streak >= days) return true; }
    else break;
  }
  return false;
}

// GET /api/achievements — returns earned + all definitions
async function getAchievements(req, res, next) {
  try {
    const [earned] = await pool.query(
      'SELECT key_name, earned_at FROM achievements WHERE user_id = ?', [req.user.id]
    );
    const earnedKeys = new Set(earned.map(a => a.key_name));
    const earnedMap  = Object.fromEntries(earned.map(a => [a.key_name, a.earned_at]));

    const all = ACHIEVEMENT_DEFS.map(def => ({
      key:         def.key,
      title:       def.title,
      description: def.description,
      icon:        def.icon,
      earned:      earnedKeys.has(def.key),
      earned_at:   earnedMap[def.key] || null,
    }));

    res.json({ achievements: all, earned_count: earnedKeys.size, total: ACHIEVEMENT_DEFS.length });
  } catch (err) { next(err); }
}

// POST /api/achievements/check — awards any newly unlocked achievements
async function checkAndAward(req, res, next) {
  try {
    const [existing] = await pool.query('SELECT key_name FROM achievements WHERE user_id = ?', [req.user.id]);
    const earnedKeys = new Set(existing.map(a => a.key_name));
    const newlyEarned = [];

    for (const def of ACHIEVEMENT_DEFS) {
      if (earnedKeys.has(def.key)) continue;
      const unlocked = await def.check(req.user.id, pool);
      if (unlocked) {
        await pool.query(
          'INSERT IGNORE INTO achievements (user_id, key_name, title, description, icon) VALUES (?,?,?,?,?)',
          [req.user.id, def.key, def.title, def.description, def.icon]
        );
        newlyEarned.push({ key: def.key, title: def.title, icon: def.icon });
      }
    }

    res.json({ newly_earned: newlyEarned });
  } catch (err) { next(err); }
}

module.exports = { getAchievements, checkAndAward };
