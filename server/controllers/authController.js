const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const SALT_ROUNDS = 12;

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, password } = req.body;
    const email = req.body.email.trim().toLowerCase(); // already validated, normalise again for safety

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hash]
    );

    const user = { id: result.insertId, name, email };
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email };
    res.json({ token: signToken(safeUser), user: safeUser });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me  (protected)
async function me(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
