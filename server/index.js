require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// Rate limiting for auth routes (applied per-route in auth router)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
});
app.set('authLimiter', authLimiter);

// Routes (added in later steps)
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/workouts',     require('./routes/workouts'));
app.use('/api/goals',        require('./routes/goals'));
app.use('/api/analytics',    require('./routes/analytics'));
app.use('/api/exercises',    require('./routes/exercises'));
app.use('/api/meals',        require('./routes/meals'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/profile',      require('./routes/profile'));
app.use('/api/measurements', require('./routes/measurements'));
app.use('/api/water',        require('./routes/water'));

// Health check — pings the DB too
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'ok', db: 'disconnected', error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

const server = app.listen(PORT, () => {
  console.log(`FitPulse server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Kill the process with: Stop-Process -Id (netstat -ano | Select-String ":${PORT}" | Select-String "LISTENING" | ForEach-Object { ($_ -split '\\s+')[-1] }) -Force`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});
