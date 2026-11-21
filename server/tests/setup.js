// Jest global setup — runs before all test suites
// Points all tests at fitpulse_test, never fitpulse

process.env.NODE_ENV  = 'test';
process.env.DB_NAME   = 'fitpulse_test';
process.env.DB_USER   = 'root';
process.env.DB_PASSWORD = '';
process.env.DB_HOST   = 'localhost';
process.env.DB_PORT   = '3306';
process.env.PORT      = '5001';   // separate port so tests don't clash with dev server
process.env.JWT_SECRET      = 'test-secret-key-do-not-use-in-production-32chars-min';
process.env.JWT_EXPIRES_IN  = '1h';
process.env.CLIENT_URL      = 'http://localhost:5173';
