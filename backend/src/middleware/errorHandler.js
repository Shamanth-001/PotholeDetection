/**
 * Global Error Handler Middleware
 */
const logger = require('../utils/logger');

module.exports = (err, req, res, _next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack, path: req.path, method: req.method });

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 10MB.' });
  }
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'Duplicate entry. This record already exists.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Referenced record does not exist.' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'An internal server error occurred.' : err.message,
  });
};
