const pool = require('../config/db');

// GET /api/analytics?period=weekly|monthly
async function getAnalytics(req, res, next) {
  try {
    const userId = req.user.id;

    // ── Summary totals ────────────────────────────────────────────────
    const [[totals]] = await pool.query(`
      SELECT
        COUNT(*)                        AS total_workouts,
        COALESCE(SUM(duration_min), 0)  AS total_duration,
        COALESCE(SUM(calories), 0)      AS total_calories,
        COALESCE(SUM(distance_km), 0)   AS total_distance
      FROM workouts WHERE user_id = ?
    `, [userId]);

    const [[goalStats]] = await pool.query(`
      SELECT
        COUNT(*)                          AS total_goals,
        SUM(is_completed = 1)             AS completed_goals
      FROM goals WHERE user_id = ?
    `, [userId]);

    // ── Recent workouts (last 5) ──────────────────────────────────────
    const [recentWorkouts] = await pool.query(`
      SELECT id, workout_date, type, duration_min, calories, distance_km
      FROM workouts WHERE user_id = ?
      ORDER BY workout_date DESC, created_at DESC
      LIMIT 5
    `, [userId]);

    // ── Weekly chart: last 8 weeks — duration + calories per week ─────
    const [weekly] = await pool.query(`
      SELECT
        YEAR(workout_date)                  AS yr,
        WEEK(workout_date, 1)               AS wk,
        MIN(workout_date)                   AS week_start,
        COUNT(*)                            AS workouts,
        COALESCE(SUM(duration_min), 0)      AS duration,
        COALESCE(SUM(calories), 0)          AS calories
      FROM workouts
      WHERE user_id = ? AND workout_date >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK)
      GROUP BY yr, wk
      ORDER BY yr, wk
    `, [userId]);

    // ── Monthly chart: last 6 months ──────────────────────────────────
    const [monthly] = await pool.query(`
      SELECT
        YEAR(workout_date)                  AS yr,
        MONTH(workout_date)                 AS mo,
        DATE_FORMAT(workout_date, '%b %Y')  AS label,
        COUNT(*)                            AS workouts,
        COALESCE(SUM(duration_min), 0)      AS duration,
        COALESCE(SUM(calories), 0)          AS calories
      FROM workouts
      WHERE user_id = ? AND workout_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY yr, mo
      ORDER BY yr, mo
    `, [userId]);

    // ── Activity by type ──────────────────────────────────────────────
    const [byType] = await pool.query(`
      SELECT type, COUNT(*) AS count
      FROM workouts WHERE user_id = ?
      GROUP BY type ORDER BY count DESC
    `, [userId]);

    res.json({
      summary: {
        total_workouts:  Number(totals.total_workouts),
        total_duration:  Number(totals.total_duration),
        total_calories:  Number(totals.total_calories),
        total_distance:  Number(totals.total_distance),
        total_goals:     Number(goalStats.total_goals),
        completed_goals: Number(goalStats.completed_goals),
        active_goals:    Number(goalStats.total_goals) - Number(goalStats.completed_goals),
      },
      recentWorkouts: recentWorkouts.map(w => ({
        ...w,
        workout_date: w.workout_date,
        duration_min: Number(w.duration_min),
        calories:     w.calories ? Number(w.calories) : null,
        distance_km:  w.distance_km ? Number(w.distance_km) : null,
      })),
      weekly:  weekly.map(r  => ({ ...r, duration: Number(r.duration),  calories: Number(r.calories),  workouts: Number(r.workouts)  })),
      monthly: monthly.map(r => ({ ...r, duration: Number(r.duration),  calories: Number(r.calories),  workouts: Number(r.workouts)  })),
      byType:  byType.map(r  => ({ name: r.type, value: Number(r.count) })),
    });
  } catch (err) { next(err); }
}

// GET /api/analytics/daily?days=7|30|90
async function getDailyChart(req, res, next) {
  try {
    const userId = req.user.id;
    const days   = Math.min(Math.max(Number(req.query.days) || 7, 7), 90);

    // Get raw data grouped by day for the requested period
    const [rows] = await pool.query(`
      SELECT
        DATE_FORMAT(workout_date, '%Y-%m-%d')   AS date_key,
        COUNT(*)                                AS workouts,
        COALESCE(SUM(duration_min), 0)          AS duration,
        COALESCE(SUM(calories), 0)              AS calories
      FROM workouts
      WHERE user_id = ?
        AND workout_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY date_key
      ORDER BY date_key
    `, [userId, days]);

    // Build a full date range so every day appears (missing days = 0)
    const dataMap = {};
    rows.forEach(r => { dataMap[r.date_key] = r; });

    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d    = new Date();
      d.setDate(d.getDate() - i);
      const key  = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('en-GB', { weekday:'short', month:'short', day:'numeric' });
      result.push({
        date:     key,
        label:    days <= 7 ? d.toLocaleDateString('en-GB', { weekday:'short' }) :
                  days <= 30 ? d.toLocaleDateString('en-GB', { month:'short', day:'numeric' }) :
                  d.toLocaleDateString('en-GB', { month:'short', day:'numeric' }),
        fullLabel: dayName,
        workouts: dataMap[key] ? Number(dataMap[key].workouts)  : 0,
        duration: dataMap[key] ? Number(dataMap[key].duration)  : 0,
        calories: dataMap[key] ? Number(dataMap[key].calories)  : 0,
        hasData:  !!dataMap[key],
      });
    }

    // Period totals
    const total_workouts  = result.reduce((s, r) => s + r.workouts, 0);
    const total_duration  = result.reduce((s, r) => s + r.duration, 0);
    const total_calories  = result.reduce((s, r) => s + r.calories, 0);
    const active_days     = result.filter(r => r.hasData).length;
    const avg_duration    = active_days ? Math.round(total_duration / active_days) : 0;

    // Previous period for comparison
    const [prevRows] = await pool.query(`
      SELECT
        COALESCE(SUM(duration_min), 0) AS duration,
        COALESCE(SUM(calories), 0)     AS calories,
        COUNT(*)                       AS workouts
      FROM workouts
      WHERE user_id = ?
        AND workout_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND workout_date <  DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [userId, days * 2, days]);

    const prev = prevRows[0] || { duration: 0, calories: 0, workouts: 0 };
    const changePct = (current, previous) => {
      if (!previous || Number(previous) === 0) return null;
      return Math.round(((current - Number(previous)) / Number(previous)) * 100);
    };

    res.json({
      days,
      data: result,
      summary: {
        total_workouts, total_duration, total_calories, active_days, avg_duration,
        change_duration: changePct(total_duration, prev.duration),
        change_calories: changePct(total_calories, prev.calories),
        change_workouts: changePct(total_workouts, prev.workouts),
      },
    });
  } catch (err) { next(err); }
}

module.exports = { getAnalytics, getDailyChart };
