const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const hash = await bcrypt.hash('password123', 12);
    console.log('Generated hash:', hash);
    
    const res = await pool.query('UPDATE users SET password_hash = $1', [hash]);
    console.log('Updated', res.rowCount, 'users');
    
    // Verify by attempting login
    const user = await pool.query('SELECT email, password_hash FROM users WHERE email = $1', ['admin@civiclens.io']);
    const match = await bcrypt.compare('password123', user.rows[0].password_hash);
    console.log('Login verification for admin:', match ? 'PASS' : 'FAIL');
    
    pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
    process.exit(1);
  }
})();
