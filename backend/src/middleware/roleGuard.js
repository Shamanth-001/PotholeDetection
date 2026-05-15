/**
 * Role-Based Access Control Middleware
 */
const { error } = require('../utils/responseHelper');

module.exports = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return error(res, 401, 'Authentication required.');
    if (!allowedRoles.includes(req.user.role)) return error(res, 403, 'Insufficient permissions.');
    next();
  };
};
