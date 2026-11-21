const crypto     = require('crypto');
const bcrypt     = require('bcrypt');
const nodemailer = require('nodemailer');
const pool       = require('../config/db');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function sendResetEmail(toEmail, resetUrl) {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) {
    // Development fallback: print to console
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧  PASSWORD RESET LINK (SMTP not configured)');
    console.log('   Email:', toEmail);
    console.log('   Link: ', resetUrl);
    console.log('   (This link expires in 1 hour)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from:    process.env.SMTP_FROM || `"FitPulse" <noreply@fitpulse.app>`,
    to:      toEmail,
    subject: 'Reset your FitPulse password',
    html: `
      <p>You requested a password reset for your FitPulse account.</p>
      <p><a href="${resetUrl}" style="background:#22c55e;color:#000;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;">Reset Password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      <p style="color:#999;font-size:12px;">Link: ${resetUrl}</p>
    `,
  });
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res, next) {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Always return 200 to avoid leaking whether email exists
    const [[user]] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.json({ message: 'If that email is registered you will receive a reset link.' });
    }

    // Invalidate old tokens for this user
    await pool.query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);

    // Create a random token (32 bytes = 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl  = `${clientUrl}/reset-password?token=${rawToken}`;
    await sendResetEmail(email, resetUrl);

    res.json({ message: 'If that email is registered you will receive a reset link.' });
  } catch (err) { next(err); }
}

// POST /api/auth/reset-password
async function resetPassword(req, res, next) {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password)
      return res.status(400).json({ error: 'token and new_password are required' });
    if (new_password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!/[A-Z]/.test(new_password))
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    if (!/[0-9]/.test(new_password))
      return res.status(400).json({ error: 'Password must contain at least one number' });

    const tokenHash = hashToken(token);
    const [[reset]] = await pool.query(
      `SELECT id, user_id, expires_at, used
       FROM password_resets
       WHERE token_hash = ? AND used = 0 AND expires_at > NOW()`,
      [tokenHash]
    );

    if (!reset) return res.status(400).json({ error: 'Invalid or expired reset link' });

    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, reset.user_id]);
    await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [reset.id]);

    res.json({ message: 'Password reset successfully' });
  } catch (err) { next(err); }
}

module.exports = { forgotPassword, resetPassword };
