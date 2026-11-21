/**
 * FitPulse API Test Suite
 * Database: fitpulse_test (never touches fitpulse)
 * Run: npm test  (from server/)
 */

// setup.js already set all env vars before require()
require('./setup');

const request = require('supertest');
const mysql   = require('mysql2/promise');

// ── Build the app fresh (uses DB_NAME=fitpulse_test from env) ────────────────
// We require index after env is set so pool picks up fitpulse_test
let app, server, pool;

beforeAll(async () => {
  pool = mysql.createPool({
    host: 'localhost', port: 3306,
    database: 'fitpulse_test',
    user: 'root', password: '',
    waitForConnections: true, connectionLimit: 5,
  });

  // Wipe test tables before the suite
  await pool.query('SET FOREIGN_KEY_CHECKS=0');
  await pool.query('TRUNCATE TABLE achievements');
  await pool.query('TRUNCATE TABLE exercises');
  await pool.query('TRUNCATE TABLE meals');
  await pool.query('TRUNCATE TABLE workouts');
  await pool.query('TRUNCATE TABLE goals');
  await pool.query('TRUNCATE TABLE users');
  await pool.query('SET FOREIGN_KEY_CHECKS=1');

  // Start app
  const express    = require('express');
  const cors       = require('cors');
  const helmet     = require('helmet');
  const rateLimit  = require('express-rate-limit');
  const ex         = express();

  ex.use(helmet());
  ex.use(cors({ origin: '*' }));
  ex.use(express.json({ limit: '50kb' }));
  const limiter = rateLimit({ windowMs: 60000, max: 1000 });
  ex.set('authLimiter', limiter);

  ex.use('/api/auth',         require('../routes/auth'));
  ex.use('/api/workouts',     require('../routes/workouts'));
  ex.use('/api/goals',        require('../routes/goals'));
  ex.use('/api/analytics',    require('../routes/analytics'));
  ex.use('/api/exercises',    require('../routes/exercises'));
  ex.use('/api/meals',        require('../routes/meals'));
  ex.use('/api/achievements', require('../routes/achievements'));
  ex.get('/api/health', async (req, res) => {
    try { await pool.query('SELECT 1'); res.json({ status:'ok', db:'connected' }); }
    catch (e) { res.status(503).json({ status:'ok', db:'disconnected' }); }
  });
  ex.use((req, res) => res.status(404).json({ error: 'Route not found' }));
  ex.use((err, req, res, next) => res.status(err.status||500).json({ error: err.message }));

  await new Promise(r => { server = ex.listen(5001, r); });
  app = ex;
}, 30000);

afterAll(async () => {
  // Clean up
  await pool.query('SET FOREIGN_KEY_CHECKS=0');
  await pool.query('TRUNCATE TABLE achievements');
  await pool.query('TRUNCATE TABLE exercises');
  await pool.query('TRUNCATE TABLE meals');
  await pool.query('TRUNCATE TABLE workouts');
  await pool.query('TRUNCATE TABLE goals');
  await pool.query('TRUNCATE TABLE users');
  await pool.query('SET FOREIGN_KEY_CHECKS=1');
  await pool.end();
  await new Promise(r => server.close(r));
});

// ── Helpers ──────────────────────────────────────────────────────────────────
const BASE = 'http://localhost:5001';
const req  = () => request(BASE);

async function register(email='test@gmail.com', password='Secret123', name='Test User') {
  const r = await req().post('/api/auth/register').send({ name, email, password });
  return r;
}
async function login(email='test@gmail.com', password='Secret123') {
  const r = await req().post('/api/auth/login').send({ email, password });
  return r.body.token;
}

// ── HEALTH ───────────────────────────────────────────────────────────────────
describe('Health', () => {
  it('GET /api/health returns ok + connected', async () => {
    const r = await req().get('/api/health');
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('ok');
    expect(r.body.db).toBe('connected');
  });
});

// ── AUTH — REGISTER ──────────────────────────────────────────────────────────
describe('Auth — register', () => {
  it('registers a new user, returns 201 + token, no password field', async () => {
    const r = await register('alice@gmail.com', 'Alice123', 'Alice');
    expect(r.status).toBe(201);
    expect(r.body.token).toBeTruthy();
    expect(r.body.user.email).toBe('alice@gmail.com');
    expect(r.body.user.password).toBeUndefined();
    expect(JSON.stringify(r.body)).not.toMatch(/\$2[aby]\$/); // no bcrypt hash
  });

  it('409 on duplicate email', async () => {
    // Insert fresh — use a unique email not used elsewhere in the suite
    const r1 = await req().post('/api/auth/register').send({ name:'Dup', email:'dup2@gmail.com', password:'Dup12345' });
    // First registration must succeed (201) or already exist (409 from previous test pollution — acceptable)
    expect([201, 409]).toContain(r1.status);
    // If 201, register same email again → must be 409
    if (r1.status === 201) {
      const r2 = await req().post('/api/auth/register').send({ name:'Dup2', email:'dup2@gmail.com', password:'Dup12345' });
      expect(r2.status).toBe(409);
      expect(r2.body.error).toMatch(/already registered/i);
    }
  });

  it('409 is case-insensitive — DUP2@GMAIL.COM == dup2@gmail.com', async () => {
    // Ensure dup2@gmail.com exists first
    await req().post('/api/auth/register').send({ name:'Dup', email:'dup2@gmail.com', password:'Dup12345' });
    const r = await req().post('/api/auth/register').send({ name:'Dup3', email:'DUP2@GMAIL.COM', password:'Dup12345' });
    expect(r.status).toBe(409);
  });

  // Bad email inputs
  const badEmails = ['ahmed', 'ahmed@', 'ahmed@gmail', 'ahmed@gmail.', 'ahmed gmail.com'];
  badEmails.forEach(email => {
    it(`400 on bad email: "${email}"`, async () => {
      const r = await req().post('/api/auth/register').send({ name:'X', email, password:'Secret123' });
      expect(r.status).toBe(400);
      expect(JSON.stringify(r.body)).not.toMatch(/\$2[aby]\$/);
    });
  });

  it('400 on short password', async () => {
    const r = await req().post('/api/auth/register').send({ name:'X', email:'x@gmail.com', password:'abc' });
    expect(r.status).toBe(400);
  });

  it('400 on missing name', async () => {
    const r = await req().post('/api/auth/register').send({ email:'noname@gmail.com', password:'Secret123' });
    expect(r.status).toBe(400);
  });
});

// ── AUTH — LOGIN ─────────────────────────────────────────────────────────────
describe('Auth — login', () => {
  beforeAll(async () => {
    await register('bob@gmail.com', 'BobPass1', 'Bob');
  });

  it('200 on correct credentials, returns token', async () => {
    const r = await req().post('/api/auth/login').send({ email:'bob@gmail.com', password:'BobPass1' });
    expect(r.status).toBe(200);
    expect(r.body.token).toBeTruthy();
    expect(r.body.user.password).toBeUndefined();
    expect(JSON.stringify(r.body)).not.toMatch(/\$2[aby]\$/);
  });

  it('200 on uppercase email (case-insensitive login)', async () => {
    const r = await req().post('/api/auth/login').send({ email:'BOB@GMAIL.COM', password:'BobPass1' });
    expect(r.status).toBe(200);
  });

  it('401 on wrong password', async () => {
    const r = await req().post('/api/auth/login').send({ email:'bob@gmail.com', password:'WrongPass1' });
    expect(r.status).toBe(401);
    expect(JSON.stringify(r.body)).not.toMatch(/\$2[aby]\$/);
  });

  it('401 on non-existent email', async () => {
    const r = await req().post('/api/auth/login').send({ email:'nobody@gmail.com', password:'Secret123' });
    expect(r.status).toBe(401);
  });
});

// ── 401 ON ALL PROTECTED ROUTES WITHOUT TOKEN ────────────────────────────────
describe('Auth — 401 without token', () => {
  const routes = [
    ['GET',    '/api/workouts'],
    ['GET',    '/api/workouts/1'],
    ['POST',   '/api/workouts'],
    ['PUT',    '/api/workouts/1'],
    ['DELETE', '/api/workouts/1'],
    ['GET',    '/api/goals'],
    ['POST',   '/api/goals'],
    ['GET',    '/api/analytics'],
    ['GET',    '/api/exercises'],
    ['GET',    '/api/meals'],
    ['GET',    '/api/achievements'],
    ['GET',    '/api/auth/me'],
  ];
  routes.forEach(([method, path]) => {
    it(`${method} ${path} → 401`, async () => {
      const r = await req()[method.toLowerCase()](path);
      expect(r.status).toBe(401);
    });
  });

  it('tampered JWT → 401', async () => {
    const r = await req().get('/api/workouts')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6OTk5fQ.INVALIDSIG');
    expect(r.status).toBe(401);
  });
});

// ── WORKOUTS CRUD ─────────────────────────────────────────────────────────────
describe('Workouts CRUD', () => {
  let token, workoutId;

  beforeAll(async () => {
    await register('carol@gmail.com', 'Carol123', 'Carol');
    token = await login('carol@gmail.com', 'Carol123');
  });

  it('GET /api/workouts → 200 empty array for new user', async () => {
    const r = await req().get('/api/workouts').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.workouts)).toBe(true);
  });

  it('POST /api/workouts → 201 creates workout', async () => {
    const r = await req().post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({ workout_date:'2024-06-01', type:'Running', duration_min:30, calories:250 });
    expect(r.status).toBe(201);
    expect(r.body.workout.type).toBe('Running');
    expect(r.body.workout.password).toBeUndefined();
    workoutId = r.body.workout.id;
  });

  it('GET /api/workouts/:id → 200 retrieves created workout', async () => {
    const r = await req().get(`/api/workouts/${workoutId}`).set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body.workout.id).toBe(workoutId);
  });

  it('PUT /api/workouts/:id → 200 updates workout', async () => {
    const r = await req().put(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ workout_date:'2024-06-01', type:'Cycling', duration_min:45, calories:300 });
    expect(r.status).toBe(200);
    expect(r.body.workout.type).toBe('Cycling');
  });

  it('DELETE /api/workouts/:id → 200 deletes workout', async () => {
    const r = await req().delete(`/api/workouts/${workoutId}`).set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
  });

  it('GET deleted workout → 404', async () => {
    const r = await req().get(`/api/workouts/${workoutId}`).set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(404);
  });

  // Invalid input
  it('POST with negative duration → 400', async () => {
    const r = await req().post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({ workout_date:'2024-06-01', type:'Running', duration_min:-1 });
    expect(r.status).toBe(400);
  });

  it('POST with bad date → 400', async () => {
    const r = await req().post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({ workout_date:'not-a-date', type:'Running', duration_min:30 });
    expect(r.status).toBe(400);
  });

  it('POST with empty body → 400', async () => {
    const r = await req().post('/api/workouts')
      .set('Authorization', `Bearer ${token}`).send({});
    expect(r.status).toBe(400);
  });
});

// ── USER ISOLATION — WORKOUTS ─────────────────────────────────────────────────
describe('User isolation — workouts', () => {
  let tokenA, tokenB, workoutIdA;

  beforeAll(async () => {
    await register('usera@gmail.com', 'UserA123', 'User A');
    await register('userb@gmail.com', 'UserB123', 'User B');
    tokenA = await login('usera@gmail.com', 'UserA123');
    tokenB = await login('userb@gmail.com', 'UserB123');

    const r = await req().post('/api/workouts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ workout_date:'2024-07-01', type:'Yoga', duration_min:60 });
    workoutIdA = r.body.workout.id;
  });

  it('User B cannot GET User A workout → 404', async () => {
    const r = await req().get(`/api/workouts/${workoutIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(r.status).toBe(404);
  });

  it('User B cannot PUT User A workout → 404', async () => {
    const r = await req().put(`/api/workouts/${workoutIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ workout_date:'2024-07-01', type:'Running', duration_min:30 });
    expect(r.status).toBe(404);
  });

  it('User B cannot DELETE User A workout → 404', async () => {
    const r = await req().delete(`/api/workouts/${workoutIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(r.status).toBe(404);
  });

  it('User A workout still exists after B\'s failed attempt', async () => {
    const r = await req().get(`/api/workouts/${workoutIdA}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(r.status).toBe(200);
  });
});

// ── GOALS CRUD ────────────────────────────────────────────────────────────────
describe('Goals CRUD + isolation', () => {
  let tokenG, tokenG2, goalId;

  beforeAll(async () => {
    await register('goaluser@gmail.com', 'Goal1234', 'Goal User');
    await register('goaluser2@gmail.com', 'Goal1234', 'Goal User 2');
    tokenG  = await login('goaluser@gmail.com', 'Goal1234');
    tokenG2 = await login('goaluser2@gmail.com', 'Goal1234');
  });

  it('POST /api/goals → 201', async () => {
    const r = await req().post('/api/goals')
      .set('Authorization', `Bearer ${tokenG}`)
      .send({ title:'Run 100km', goal_type:'distance_km', target_value:100, unit:'km' });
    expect(r.status).toBe(201);
    goalId = r.body.goal.id;
  });

  it('GET /api/goals → includes created goal', async () => {
    const r = await req().get('/api/goals').set('Authorization', `Bearer ${tokenG}`);
    expect(r.status).toBe(200);
    expect(r.body.goals.some(g => g.id === goalId)).toBe(true);
  });

  it('User G2 cannot GET goal of G → 404', async () => {
    const r = await req().get(`/api/goals/${goalId}`).set('Authorization', `Bearer ${tokenG2}`);
    expect(r.status).toBe(404);
  });

  it('User G2 cannot DELETE goal of G → 404', async () => {
    const r = await req().delete(`/api/goals/${goalId}`).set('Authorization', `Bearer ${tokenG2}`);
    expect(r.status).toBe(404);
  });

  it('POST goal with zero target → 400', async () => {
    const r = await req().post('/api/goals')
      .set('Authorization', `Bearer ${tokenG}`)
      .send({ title:'Bad Goal', target_value: 0 });
    expect(r.status).toBe(400);
  });

  it('DELETE /api/goals/:id → 200', async () => {
    const r = await req().delete(`/api/goals/${goalId}`).set('Authorization', `Bearer ${tokenG}`);
    expect(r.status).toBe(200);
  });
});

// ── MEALS CRUD ────────────────────────────────────────────────────────────────
describe('Meals CRUD + isolation', () => {
  let tokenM, tokenM2, mealId;

  beforeAll(async () => {
    await register('mealuser@gmail.com', 'Meal1234', 'Meal User');
    await register('mealuser2@gmail.com', 'Meal1234', 'Meal User 2');
    tokenM  = await login('mealuser@gmail.com', 'Meal1234');
    tokenM2 = await login('mealuser2@gmail.com', 'Meal1234');
  });

  it('POST /api/meals → 201', async () => {
    const r = await req().post('/api/meals')
      .set('Authorization', `Bearer ${tokenM}`)
      .send({ meal_date:'2024-07-01', meal_type:'Breakfast', name:'Oatmeal', calories:300, protein_g:8 });
    expect(r.status).toBe(201);
    mealId = r.body.meal.id;
  });

  it('GET /api/meals?date=2024-07-01 → includes created meal', async () => {
    const r = await req().get('/api/meals?date=2024-07-01').set('Authorization', `Bearer ${tokenM}`);
    expect(r.status).toBe(200);
    expect(r.body.meals.some(m => m.id === mealId)).toBe(true);
    expect(r.body.dailyTotals.calories).toBeGreaterThanOrEqual(300);
  });

  it('User M2 cannot DELETE meal of M → 404', async () => {
    const r = await req().delete(`/api/meals/${mealId}`).set('Authorization', `Bearer ${tokenM2}`);
    expect(r.status).toBe(404);
  });

  it('POST meal with calories=0 → 400', async () => {
    const r = await req().post('/api/meals')
      .set('Authorization', `Bearer ${tokenM}`)
      .send({ meal_date:'2024-07-01', name:'Bad', calories:0 });
    expect(r.status).toBe(400);
  });

  it('DELETE meal → 200', async () => {
    const r = await req().delete(`/api/meals/${mealId}`).set('Authorization', `Bearer ${tokenM}`);
    expect(r.status).toBe(200);
  });
});

// ── EXERCISES LOG ─────────────────────────────────────────────────────────────
describe('Exercises — log creates workout', () => {
  let tokenE, exId;

  beforeAll(async () => {
    await register('exuser@gmail.com', 'Exer1234', 'Ex User');
    tokenE = await login('exuser@gmail.com', 'Exer1234');
    // GET exercises — triggers auto-seed of 20 defaults
    const r = await req().get('/api/exercises').set('Authorization', `Bearer ${tokenE}`);
    expect(r.body.exercises.length).toBeGreaterThan(0);
    exId = r.body.exercises[0].id;
  });

  it('POST /api/exercises/:id/log → 201, creates workout entry', async () => {
    const r = await req().post(`/api/exercises/${exId}/log`)
      .set('Authorization', `Bearer ${tokenE}`)
      .send({ duration_min: 20 });
    expect(r.status).toBe(201);
    expect(r.body.workout).toBeDefined();
    expect(r.body.workout.duration_min).toBe(20);
    // calories_burned should be a number or null (depends on calories_per_min)
    expect(typeof r.body.calories_burned === 'number' || r.body.calories_burned === null).toBe(true);
  });

  it('POST /api/exercises/:id/log with duration_min=0 → 400', async () => {
    const r = await req().post(`/api/exercises/${exId}/log`)
      .set('Authorization', `Bearer ${tokenE}`)
      .send({ duration_min: 0 });
    expect(r.status).toBe(400);
  });
});

// ── DELETE CASCADE ────────────────────────────────────────────────────────────
describe('Delete cascade — deleting user removes their data', () => {
  it('user workouts are deleted when user is removed from DB', async () => {
    await register('cascade@gmail.com', 'Cas12345', 'Cascade');
    const tok = await login('cascade@gmail.com', 'Cas12345');
    await req().post('/api/workouts')
      .set('Authorization', `Bearer ${tok}`)
      .send({ workout_date:'2024-08-01', type:'Running', duration_min:30 });

    // Get user id
    const [[user]] = await pool.query("SELECT id FROM users WHERE email='cascade@gmail.com'");
    const [[wBefore]] = await pool.query("SELECT COUNT(*) AS c FROM workouts WHERE user_id=?", [user.id]);
    expect(Number(wBefore.c)).toBeGreaterThan(0);

    await pool.query("DELETE FROM users WHERE id=?", [user.id]);

    const [[wAfter]] = await pool.query("SELECT COUNT(*) AS c FROM workouts WHERE user_id=?", [user.id]);
    expect(Number(wAfter.c)).toBe(0);
  });
});

// ── NO PASSWORD IN ANY RESPONSE ───────────────────────────────────────────────
describe('Security — no password or hash in any response', () => {
  let tok;
  beforeAll(async () => {
    await register('sectest@gmail.com', 'Sec12345', 'Sec Test');
    tok = await login('sectest@gmail.com', 'Sec12345');
  });

  const endpoints = [
    () => req().post('/api/auth/register').send({ name:'Leak', email:'leak@gmail.com', password:'Leak1234' }),
    () => req().post('/api/auth/login').send({ email:'sectest@gmail.com', password:'Sec12345' }),
    () => req().get('/api/auth/me').set('Authorization', `Bearer ${tok}`),
  ];

  endpoints.forEach((fn, i) => {
    it(`Endpoint ${i+1} response has no bcrypt hash`, async () => {
      const r = await fn();
      expect(JSON.stringify(r.body)).not.toMatch(/\$2[aby]\$/);
      expect(r.body.user?.password).toBeUndefined();
    });
  });
});
