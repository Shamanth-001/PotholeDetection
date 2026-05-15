/**
 * PostgreSQL/PostGIS Database Connection Pool
 */
const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('error', (err) => {
  logger.error(`Unexpected database error: ${err.message}`);
});

// Verify PostGIS on startup
pool.query('SELECT PostGIS_Version()')
  .then((res) => logger.info(`✅ PostGIS connected: v${res.rows[0].postgis_version}`))
  .catch((err) => logger.warn(`⚠️ PostGIS check failed: ${err.message} — DB may not be ready yet`));

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
