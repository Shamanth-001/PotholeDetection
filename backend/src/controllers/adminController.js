/**
 * Admin Controller — Analytics, heatmap, management
 */
const db = require('../config/database');
const spatialService = require('../services/spatialService');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseHelper');

exports.getHeatmapData = async (req, res) => {
  try {
    const { days = 30, issue_type } = req.query;
    const data = await spatialService.getHeatmapData(parseInt(days), issue_type || null);
    const points = data.map(p => ({ lat: p.latitude, lng: p.longitude, intensity: parseFloat(p.intensity) || 0.5, report_count: parseInt(p.report_count) || 1 }));
    return success(res, 200, 'Heatmap data.', { points, total_points: points.length, time_range_days: parseInt(days) });
  } catch (err) { logger.error(`Heatmap: ${err.message}`); return error(res, 500, 'Failed to retrieve heatmap data.'); }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const overview = await db.query(`
      SELECT COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'ai_verified') as ai_verified,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d,
        AVG(priority_score) as avg_priority,
        AVG(CASE WHEN ai_confidence > 0 THEN ai_confidence ELSE NULL END) as avg_ai_confidence
      FROM reports WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
    `, [days]);

    const byType = await db.query(`
      SELECT issue_type, COUNT(*) as count, AVG(priority_score) as avg_priority
      FROM reports WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL GROUP BY issue_type ORDER BY count DESC
    `, [days]);

    const dailyTrend = await db.query(`
      SELECT date_trunc('day', created_at)::DATE as date, COUNT(*) as reports, COUNT(*) FILTER (WHERE status = 'resolved') as resolved
      FROM reports WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL GROUP BY date_trunc('day', created_at) ORDER BY date ASC
    `, [days]);

    const volunteerStats = await db.query(`
      SELECT (SELECT COUNT(*) FROM volunteer_drives WHERE status = 'completed') as completed_drives,
        (SELECT COUNT(*) FROM volunteer_drives WHERE status IN ('open_for_registration','planned')) as active_drives,
        (SELECT COUNT(DISTINCT user_id) FROM drive_volunteers WHERE attended = TRUE) as active_volunteers,
        (SELECT COALESCE(SUM(hours_contributed), 0) FROM drive_volunteers WHERE attended = TRUE) as total_hours
    `);

    return success(res, 200, 'Analytics.', { overview: overview.rows[0], by_issue_type: byType.rows, daily_trend: dailyTrend.rows, volunteer_stats: volunteerStats.rows[0], time_range_days: parseInt(days) });
  } catch (err) { logger.error(`Analytics: ${err.message}`); return error(res, 500, 'Failed to retrieve analytics.'); }
};

exports.getWardStatistics = async (req, res) => {
  try {
    const data = await spatialService.getWardStatistics();
    return success(res, 200, 'Ward stats.', { wards: data });
  } catch (err) { return error(res, 500, 'Failed.'); }
};

exports.getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, issue_type, urgency, sort_by = 'created_at' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = `SELECT r.*, ST_Y(r.location) as latitude, ST_X(r.location) as longitude, u.full_name as reported_by_name, u.email as reported_by_email FROM reports r LEFT JOIN users u ON r.reported_by = u.id WHERE 1=1`;
    const params = []; let pc = 0;
    if (status) { pc++; query += ` AND r.status = $${pc}`; params.push(status); }
    if (issue_type) { pc++; query += ` AND r.issue_type = $${pc}`; params.push(issue_type); }
    if (urgency) { pc++; query += ` AND r.urgency = $${pc}`; params.push(urgency); }
    query += ` ORDER BY r.${sort_by === 'priority' ? 'priority_score' : 'created_at'} DESC`;
    pc++; query += ` LIMIT $${pc}`; params.push(parseInt(limit));
    pc++; query += ` OFFSET $${pc}`; params.push(offset);
    const result = await db.query(query, params);
    const countResult = await db.query('SELECT COUNT(*) FROM reports');
    return success(res, 200, 'Reports.', { reports: result.rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(countResult.rows[0].count) } });
  } catch (err) { return error(res, 500, 'Failed.'); }
};

exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, urgency, assigned_to, resolution_notes } = req.body;
    const fields = []; const params = []; let pc = 0;
    if (status) { pc++; fields.push(`status = $${pc}`); params.push(status); if (status === 'resolved') { fields.push('resolved_at = NOW()'); pc++; fields.push(`resolved_by = $${pc}`); params.push(req.user.id); } }
    if (urgency) { pc++; fields.push(`urgency = $${pc}`); params.push(urgency); }
    if (assigned_to) { pc++; fields.push(`assigned_to = $${pc}`); params.push(assigned_to); }
    if (resolution_notes) { pc++; fields.push(`resolution_notes = $${pc}`); params.push(resolution_notes); }
    if (fields.length === 0) return error(res, 400, 'No fields to update.');
    pc++; params.push(id);
    const result = await db.query(`UPDATE reports SET ${fields.join(', ')} WHERE id = $${pc} RETURNING *`, params);
    if (result.rows.length === 0) return error(res, 404, 'Not found.');
    return success(res, 200, 'Updated.', { report: result.rows[0] });
  } catch (err) { return error(res, 500, 'Failed.'); }
};

exports.getUsers = async (req, res) => {
  try {
    const result = await db.query(`SELECT id, email, full_name, display_name, role, points, reports_submitted, certificates_earned, volunteer_hours, is_active, created_at, last_login_at FROM users ORDER BY created_at DESC`);
    return success(res, 200, 'Users.', { users: result.rows });
  } catch (err) { return error(res, 500, 'Failed.'); }
};

exports.exportReports = async (req, res) => {
  try {
    const { format = 'json', days = 30 } = req.query;
    const result = await db.query(`
      SELECT r.id, r.issue_type, r.description, r.status, r.urgency, r.priority_score, r.upvote_count,
        r.address_text, ST_Y(r.location) as latitude, ST_X(r.location) as longitude,
        r.ai_detected_class, r.ai_confidence, r.created_at, r.resolved_at, u.full_name as reported_by
      FROM reports r LEFT JOIN users u ON r.reported_by = u.id
      WHERE r.created_at >= NOW() - ($1 || ' days')::INTERVAL ORDER BY r.created_at DESC
    `, [days]);
    if (format === 'csv') {
      const headers = Object.keys(result.rows[0] || {}).join(',');
      const rows = result.rows.map(r => Object.values(r).map(v => `"${v || ''}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=civiclens_export_${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(`${headers}\n${rows}`);
    }
    return success(res, 200, 'Export.', { reports: result.rows, count: result.rows.length });
  } catch (err) { return error(res, 500, 'Export failed.'); }
};

exports.refreshAnalytics = async (req, res) => {
  try { await db.query('SELECT refresh_analytics()'); return success(res, 200, 'Refreshed.'); }
  catch (err) { return error(res, 500, 'Refresh failed.'); }
};

/**
 * POST /api/admin/drives — Create a cleanup drive (pushed to user dashboard as notification)
 */
exports.createDrive = async (req, res) => {
  try {
    const { title, description, address_text, scheduled_date, start_time, end_time, max_volunteers, target_issue_type, latitude, longitude } = req.body;
    if (!title || !scheduled_date) return error(res, 400, 'Title and scheduled date are required.');

    const { v4: uuidv4 } = require('uuid');
    const driveId = uuidv4();
    const lat = parseFloat(latitude) || 12.9716;
    const lng = parseFloat(longitude) || 77.5946;

    const result = await db.query(`
      INSERT INTO volunteer_drives (id, title, description, location, address_text, scheduled_date, start_time, end_time, max_volunteers, target_issue_type, organized_by, status)
      VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8, $9, $10, $11, $12, 'open_for_registration')
      RETURNING id, title, scheduled_date, start_time, end_time, max_volunteers, current_volunteers, status
    `, [driveId, title, description || null, lng, lat, address_text || null, scheduled_date, start_time || '09:00', end_time || '12:00', max_volunteers || 20, target_issue_type || 'garbage', req.user.id]);

    logger.info(`Admin created drive: ${title} on ${scheduled_date}`);
    return success(res, 201, 'Cleanup drive created! Users will see it in their dashboard.', { drive: result.rows[0] });
  } catch (err) {
    logger.error(`Create drive failed: ${err.message}`);
    return error(res, 500, 'Failed to create drive.');
  }
};
