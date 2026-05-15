const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/stats', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM reports) as total_reports,
        (SELECT COUNT(*) FROM reports WHERE status = 'resolved') as resolved_reports,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM volunteer_drives WHERE status = 'completed') as completed_drives,
        (SELECT COALESCE(SUM(upvote_count), 0) FROM reports) as total_upvotes,
        (SELECT COUNT(*) FROM certificates) as total_certificates
    `);
    res.json({ success: true, data: stats.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch stats' }); }
});

router.get('/reports/map', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, issue_type, status, urgency, priority_score,
        ST_Y(location) as latitude, ST_X(location) as longitude, created_at
      FROM reports WHERE status NOT IN ('closed', 'ai_rejected')
      ORDER BY created_at DESC LIMIT 500
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch map data' }); }
});

/**
 * GET /api/public/leaderboard — Top citizens by points
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, display_name, full_name, points, reports_submitted, reports_verified,
        certificates_earned, volunteer_hours, role, created_at
      FROM users
      WHERE role != 'admin'
      ORDER BY points DESC
      LIMIT 20
    `);

    // Top stats
    const topReporter = await db.query(`
      SELECT display_name, reports_submitted FROM users WHERE role != 'admin'
      ORDER BY reports_submitted DESC LIMIT 1
    `);

    const totalVolunteers = await db.query(`
      SELECT COUNT(DISTINCT user_id) as count FROM drive_volunteers WHERE attended = TRUE
    `);

    res.json({
      success: true,
      data: {
        leaderboard: result.rows,
        highlights: {
          top_reporter: topReporter.rows[0] || null,
          total_active_volunteers: parseInt(totalVolunteers.rows[0]?.count || 0),
        }
      }
    });
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
