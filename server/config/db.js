const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME     || 'fitpulse',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Warn on startup but do NOT exit — let /api/health surface the state
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('⚠️  MySQL connection warning:', err.message);
    console.error('   → Make sure XAMPP MySQL is running and .env credentials are correct.');
    console.error('   → GET /api/health will show db: "disconnected" until fixed.');
  }
})();

module.exports = pool;
