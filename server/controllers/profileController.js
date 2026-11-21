const bcrypt = require('bcrypt');
const pool   = require('../config/db');

// GET /api/profile
async function getProfile(req, res, next) {
  try {
    const [[user]] = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
}

// PUT /api/profile/name
async function updateName(req, res, next) {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (name.length > 100) return res.status(400).json({ error: 'Name must be under 100 characters' });
    await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
    res.json({ message: 'Name updated', name });
  } catch (err) { next(err); }
}

// PUT /api/profile/password
async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ error: 'current_password and new_password are required' });
    if (new_password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!/[A-Z]/.test(new_password))
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    if (!/[0-9]/.test(new_password))
      return res.status(400).json({ error: 'Password must contain at least one number' });

    const [[user]] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(current_password, user.password);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
}

// DELETE /api/profile
async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required to delete account' });

    const [[user]] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });

    // CASCADE will delete workouts, goals, meals, exercises, achievements, etc.
    await pool.query('DELETE FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Account deleted' });
  } catch (err) { next(err); }
}

module.exports = { getProfile, updateName, changePassword, deleteAccount };
