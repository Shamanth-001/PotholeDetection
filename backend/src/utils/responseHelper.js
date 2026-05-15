/**
 * Standardized API Response Helpers
 */
exports.success = (res, statusCode, message, data = null) => {
  const response = { success: true, message, timestamp: new Date().toISOString() };
  if (data) response.data = data;
  return res.status(statusCode).json(response);
};

exports.error = (res, statusCode, message, details = null) => {
  const response = { success: false, message, timestamp: new Date().toISOString() };
  if (details && process.env.NODE_ENV !== 'production') response.details = details;
  return res.status(statusCode).json(response);
};
