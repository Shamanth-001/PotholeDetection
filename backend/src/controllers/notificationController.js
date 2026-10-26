const db = require('../config/database');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseHelper');

/**
 * Helper to create a notification in DB
 * @param {string} userId - Target user ID
 * @param {string} title - Notification Title
 * @param {string} message - Detailed notification body
 * @param {string|null} reportId - Optional associated report ID
 * @param {string} type - 'info', 'success', 'warning', 'error'
 */
const createNotification = async (userId, title, message, reportId = null, type = 'info') => {
  try {
    const result = await db.query(
      `INSERT INTO notifications (user_id, title, message, report_id, type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, title, message, reportId, type]
    );
    
    // Mock Email/Push Notification Log
    logger.info(`[MOCK NOTIFICATION DISPATCHED] Type: Email/Push | Recipient: ${userId} | Title: "${title}" | Message: "${message}"`);
    
    return result.rows[0];
  } catch (err) {
    logger.error(`Failed to create notification: ${err.message}`);
    return null;
  }
};

/**
 * GET /api/notifications — Retrieve current user's notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    return success(res, 200, 'Notifications retrieved.', {
      notifications: result.rows
    });
  } catch (err) {
    logger.error(`Get notifications failed: ${err.message}`);
    return error(res, 500, 'Failed to retrieve notifications.');
  }
};

/**
 * PATCH /api/notifications/read — Mark all user's notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query(
      `UPDATE notifications 
       SET read = true 
       WHERE user_id = $1`,
      [userId]
    );

    return success(res, 200, 'All notifications marked as read.');
  } catch (err) {
    logger.error(`Mark notifications read failed: ${err.message}`);
    return error(res, 500, 'Failed to mark notifications as read.');
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAllAsRead
};
