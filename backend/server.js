/**
 * CivicLens AI — Backend Server Entry Point
 */
require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 CivicLens Backend running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🗄️  Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
  logger.info(`🤖 AI Service: ${process.env.AI_SERVICE_URL || 'http://localhost:8000'}`);
});
