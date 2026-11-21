/**
 * verify-storage.js — Proof-of-storage script
 * Creates a test user, saves one record per feature through the real API,
 * reads each back directly from the DB, then cleans up.
 *
 * Usage: node scripts/verify-storage.js
 * Requires: server running on port 5000, fitpulse DB with all tables.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const http  = require('http');
const mysql = require('mysql2/promise');

const BASE  = 'http://localhost:5000/api';
const DB    = { host:'localhost', port:3306, database:'fitpulse', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '' };
const TEST_EMAIL    = `verify_test_${Date.now()}@gmail.com`;
const TEST_PASSWORD = 'Verify123';
const TEST_NAME     = 'Verify Script';

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 5000,
      path: `/api${path}`, method,
      headers: {
        'Content-Type': 'application/json',
        ...(data   && { 'Content-Length': Buffer.byteLength(data) }),
        ...(token  && { 'Authorization': `Bearer ${token}` }),
      },
    };
    const req = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Formatting ────────────────────────────────────────────────────────────────
function row(feature, table, found, valMatch) {
  const ok = found && valMatch;
  return `  ${ok ? '✅' : '❌'} ${feature.padEnd(25)} ${table.padEnd(22)} ${found ? 'YES' : 'NO '.padEnd(3)} ${valMatch ? 'YES' : 'NO'}`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  const pool = await mysql.createPool({ ...DB, waitForConnections:true, connectionLimit:5 });
  let token, userId;
  const results = [];

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  FitPulse — Storage Verification Script');
  console.log('  Database:', DB.database);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // ── 1. Register ──────────────────────────────────────────────────────────
    const reg = await request('POST', '/auth/register', { name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD });
    token  = reg.body.token;
    userId = reg.body.user?.id;
    if (!token || !userId) throw new Error('Registration failed: ' + JSON.stringify(reg.body));

    // Verify in DB
    const [[uRow]] = await pool.query('SELECT id, email, password FROM users WHERE id = ?', [userId]);
    const hashOk   = uRow?.password?.startsWith('$2');
    const plainOk  = uRow?.password !== TEST_PASSWORD;
    results.push(row('Register / users', 'users', !!uRow, uRow?.email === TEST_EMAIL));
    results.push(row('Password is bcrypt hash', 'users.password', hashOk && plainOk, hashOk && plainOk));

    // ── 2. Login ─────────────────────────────────────────────────────────────
    const log = await request('POST', '/auth/login', { email: TEST_EMAIL, password: TEST_PASSWORD });
    results.push(row('Login returns token', 'users', !!log.body.token, log.status === 200));

    // ── 3. Workout ───────────────────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);
    const wRes  = await request('POST', '/workouts', { workout_date: today, type:'Running', duration_min:45, calories:350 }, token);
    const wId   = wRes.body.workout?.id;
    const [[wRow]] = await pool.query('SELECT * FROM workouts WHERE id = ? AND user_id = ?', [wId, userId]);
    results.push(row('Create workout', 'workouts', !!wRow, wRow?.type === 'Running' && Number(wRow?.duration_min) === 45));

    // ── 4. Goal ──────────────────────────────────────────────────────────────
    const gRes  = await request('POST', '/goals', { title:'Run 100km', goal_type:'distance_km', target_value:100, unit:'km' }, token);
    const gId   = gRes.body.goal?.id;
    const [[gRow]] = await pool.query('SELECT * FROM goals WHERE id = ? AND user_id = ?', [gId, userId]);
    results.push(row('Create goal', 'goals', !!gRow, gRow?.title === 'Run 100km'));

    // ── 5. Meal ──────────────────────────────────────────────────────────────
    const mRes  = await request('POST', '/meals', { meal_date: today, meal_type:'Breakfast', name:'Oatmeal', calories:300, protein_g:8 }, token);
    const mId   = mRes.body.meal?.id;
    const [[mRow]] = await pool.query('SELECT * FROM meals WHERE id = ? AND user_id = ?', [mId, userId]);
    results.push(row('Create meal', 'meals', !!mRow, mRow?.name === 'Oatmeal' && Number(mRow?.calories) === 300));

    // ── 6. Exercise log ──────────────────────────────────────────────────────
    const exList = await request('GET', '/exercises', null, token);
    const exId   = exList.body.exercises?.[0]?.id;
    let exLogOk  = false;
    if (exId) {
      const elRes = await request('POST', `/exercises/${exId}/log`, { duration_min: 20 }, token);
      exLogOk = elRes.status === 201 && !!elRes.body.workout?.id;
    }
    results.push(row('Log exercise → workout', 'workouts', exLogOk, exLogOk));

    // ── 7. Body measurement ──────────────────────────────────────────────────
    const bmRes = await request('POST', '/measurements', { measured_at: today, weight_kg: 72.5, waist_cm: 80 }, token);
    const bmId  = bmRes.body.measurement?.id;
    const [[bmRow]] = await pool.query('SELECT * FROM body_measurements WHERE id = ? AND user_id = ?', [bmId, userId]);
    results.push(row('Body measurement', 'body_measurements', !!bmRow, Number(bmRow?.weight_kg) === 72.5));

    // ── 8. Water intake ──────────────────────────────────────────────────────
    const wtrRes = await request('POST', '/water', { logged_date: today, amount_ml: 500 }, token);
    const wtrId  = wtrRes.body.entry?.id;
    const [[wtrRow]] = await pool.query('SELECT * FROM water_intake WHERE id = ? AND user_id = ?', [wtrId, userId]);
    results.push(row('Water intake', 'water_intake', !!wtrRow, Number(wtrRow?.amount_ml) === 500));

    // ── 9. Achievement ───────────────────────────────────────────────────────
    await request('POST', '/achievements/check', null, token);
    const [achRows] = await pool.query('SELECT * FROM achievements WHERE user_id = ?', [userId]);
    results.push(row('Achievement awarded', 'achievements', achRows.length > 0, achRows.length > 0));

    // ── 10. Password reset token ─────────────────────────────────────────────
    const fpRes = await request('POST', '/auth/forgot-password', { email: TEST_EMAIL });
    const [[prRow]] = await pool.query('SELECT * FROM password_resets WHERE user_id = ?', [userId]);
    results.push(row('Password reset token', 'password_resets', !!prRow, prRow?.used === 0 && !!prRow?.token_hash));

    // ── 11. Analytics (reads from workouts) ──────────────────────────────────
    const anRes = await request('GET', '/analytics', null, token);
    const anOk  = anRes.status === 200 && anRes.body.summary?.total_workouts >= 1;
    results.push(row('Analytics endpoint', 'workouts (read)', anOk, anOk));

    // ── 12. Daily chart ──────────────────────────────────────────────────────
    const dcRes = await request('GET', '/analytics/daily?days=7', null, token);
    const dcOk  = dcRes.status === 200 && Array.isArray(dcRes.body.data) && dcRes.body.data.length === 7;
    results.push(row('Daily chart (7 days)', 'workouts (read)', dcOk, dcOk));

  } catch (err) {
    console.error('❌ Script error:', err.message);
  }

  // ── Print results ────────────────────────────────────────────────────────
  console.log('  Feature                   Table                  Found  Values Match?');
  console.log('  ─────────────────────────────────────────────────────────────────────');
  results.forEach(r => console.log(r));
  const passed = results.filter(r => r.includes('✅')).length;
  console.log(`\n  ${passed}/${results.length} checks passed\n`);

  // ── Cleanup ──────────────────────────────────────────────────────────────
  if (userId) {
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    console.log('  🧹 Test user and all cascade data deleted.\n');
  }
  await pool.end();
  process.exit(0);
})();
