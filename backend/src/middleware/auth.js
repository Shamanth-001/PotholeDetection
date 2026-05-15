/**
 * JWT Authentication Middleware
 */
const jwt = require('jsonwebtoken');
const { error } = require('../utils/responseHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 401, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return error(res, 401, 'Token expired. Please login again.');
    if (err.name === 'JsonWebTokenError') return error(res, 401, 'Invalid token.');
    return error(res, 401, 'Authentication failed.');
  }
};
