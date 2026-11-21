// app.js — Express app factory (no listen call — used by index.js and tests)
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

function createApp(pool) {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ extended: false, limit: '50kb' }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 1000 : 20,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.set('authLimiter', authLimiter);

  // Inject pool so controllers can use it (tests pass a test-DB pool)
  app.set('pool', pool);

  app.use('/api/auth',         require('./routes/auth'));
  app.use('/api/workouts',     require('./routes/workouts'));
  app.use('/api/goals',        require('./routes/goals'));
  app.use('/api/analytics',    require('./routes/analytics'));
  app.use('/api/exercises',    require('./routes/exercises'));
  app.use('/api/meals',        require('./routes/meals'));
  app.use('/api/achievements', require('./routes/achievements'));

  app.get('/api/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
    } catch (err) {
      res.status(503).json({ status: 'ok', db: 'disconnected', error: err.message });
    }
  });

  app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

  app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    res.status(status).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
  });

  return app;
}

module.exports = createApp;
