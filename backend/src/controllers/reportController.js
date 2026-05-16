/**
 * Report Controller — Core submission with spatial duplicate detection
 * Fixes applied: #4 (parameterized spatial query), #6 (all handlers implemented)
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const aiService = require('../services/aiService');
const spatialService = require('../services/spatialService');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseHelper');

/**
 * POST /api/reports — Full submission pipeline
 */
exports.createReport = async (req, res) => {
  try {
    const { latitude, longitude, description, issue_type, address } = req.body;
    const userId = req.user.id;
    const imageFile = req.file;

    if (!latitude || !longitude) return error(res, 400, 'Location coordinates are required.');
    if (!imageFile) return error(res, 400, 'An image is required.');
    if (!issue_type) return error(res, 400, 'Issue type is required.');

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return error(res, 400, 'Invalid coordinates.');
    }

    // Step 1: AI Analysis
    let aiResult;
    try {
      aiResult = await aiService.analyzeImage(imageFile.path || imageFile.buffer, issue_type);
      logger.info(`AI: ${aiResult.detected_class} (${aiResult.confidence})`);
    } catch (aiErr) {
      logger.warn(`AI unavailable: ${aiErr.message}. Proceeding without verification.`);
      aiResult = { detected_class: issue_type, confidence: 0, bounding_boxes: [], timestamp: new Date().toISOString(), error: true };
    }

    // Step 2: Confidence check
    const threshold = parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.7;
    let reportStatus = 'pending';
    
    // Check if AI actually performed the analysis (did not error out)
    const aiPerformed = aiResult && !aiResult.error;

    if (aiPerformed && aiResult.confidence === 0) {
      return res.status(400).json({
        success: false,
        message: 'AI Verification Failed: No pothole or garbage detected in the image.'
      });
    } else if (aiResult.confidence >= threshold) {
      reportStatus = 'ai_verified';
    } else {
      // If confidence is low OR AI service was unavailable, set to under_review
      reportStatus = 'under_review';
    }

    // Step 3: Spatial duplicate detection (10m radius)
    const nearbyReports = await spatialService.findNearbyReports(lat, lng, 10, issue_type);

    if (nearbyReports && nearbyReports.length > 0) {
      const existing = nearbyReports[0];
      logger.info(`Duplicate: report ${existing.report_id} is ${existing.distance_meters}m away`);
      return res.status(200).json({
        success: true, duplicate: true,
        message: 'A similar issue has already been reported near this location.',
        existing_report: {
          id: existing.report_id, issue_type: existing.r_issue_type,
          description: existing.r_description, status: existing.r_status,
          priority_score: existing.r_priority_score, upvote_count: existing.r_upvote_count,
          image_url: existing.r_image_url, created_at: existing.r_created_at,
          reported_by: existing.reported_by_name,
          distance_meters: Math.round(existing.distance_meters * 100) / 100,
        },
        action: 'upvote',
        upvote_url: `/api/reports/${existing.report_id}/upvote`,
      });
    }

    // Step 4: Insert new report
    const imageUrl = `/uploads/${imageFile.filename || uuidv4() + '.jpg'}`;
    const reportId = uuidv4();
    const result = await db.query(`
      INSERT INTO reports (id, location, address_text, issue_type, description, image_url,
        ai_detected_class, ai_confidence, ai_bounding_boxes, ai_verification_status, ai_processed_at,
        status, reported_by, source)
      VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, issue_type, status, ai_confidence, ai_detected_class, created_at,
                ST_Y(location) as latitude, ST_X(location) as longitude
    `, [
      reportId, lng, lat, address || null, issue_type, description || null, imageUrl,
      aiResult.detected_class, aiResult.confidence, JSON.stringify(aiResult.bounding_boxes),
      aiResult.confidence >= threshold ? 'verified' : 'pending', new Date().toISOString(),
      reportStatus, userId, 'web',
    ]);

    await db.query('UPDATE users SET reports_submitted = reports_submitted + 1, points = points + 10 WHERE id = $1', [userId]);
    logger.info(`New report: ${reportId}`);

    return res.status(201).json({
      success: true, duplicate: false, message: 'Report submitted successfully!',
      report: result.rows[0],
      ai_analysis: { detected_class: aiResult.detected_class, confidence: aiResult.confidence, meets_threshold: aiResult.confidence >= threshold },
      points_earned: 10,
    });
  } catch (err) {
    logger.error(`Report creation failed: ${err.message}`, { stack: err.stack });
    return error(res, 500, 'Failed to submit report.');
  }
};

/**
 * POST /api/reports/:id/upvote
 */
exports.upvoteReport = async (req, res) => {
  try {
    const { id: reportId } = req.params;
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    const existing = await db.query('SELECT id FROM upvotes WHERE report_id = $1 AND user_id = $2', [reportId, userId]);
    if (existing.rows.length > 0) return error(res, 409, 'You have already upvoted this report.');

    const params = [uuidv4(), reportId, userId];
    let locationSql = 'NULL';
    let distance = null;

    if (latitude && longitude) {
      locationSql = `ST_SetSRID(ST_MakePoint($4, $5), 4326)`;
      params.push(parseFloat(longitude), parseFloat(latitude));
      const distResult = await db.query(
        `SELECT ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance FROM reports WHERE id = $3`,
        [parseFloat(longitude), parseFloat(latitude), reportId]
      );
      distance = distResult.rows[0]?.distance || null;
    }

    await db.query(
      `INSERT INTO upvotes (id, report_id, user_id, user_location, distance_from_report) VALUES ($1, $2, $3, ${locationSql}, $${params.length + 1})`,
      [...params, distance]
    );

    // Grant 5 points for verifying/upvoting a duplicate
    await db.query('UPDATE users SET points = points + 5 WHERE id = $1', [userId]);

    // Flag for human verification by setting to under_review (if not already resolved/closed)
    await db.query(
      `UPDATE reports SET status = 'under_review' WHERE id = $1 AND status NOT IN ('resolved', 'closed')`,
      [reportId]
    );

    const updated = await db.query('SELECT priority_score, upvote_count, urgency FROM reports WHERE id = $1', [reportId]);

    return success(res, 200, 'Upvote recorded!', {
      report_id: reportId,
      new_priority_score: updated.rows[0].priority_score,
      new_upvote_count: updated.rows[0].upvote_count,
      new_urgency: updated.rows[0].urgency,
    });
  } catch (err) {
    logger.error(`Upvote failed: ${err.message}`);
    return error(res, 500, 'Failed to record upvote.');
  }
};

/**
 * GET /api/reports — List reports with filters
 * Fix #4: proper parameterized spatial query (no string concatenation)
 */
exports.getReports = async (req, res) => {
  try {
    const { issue_type, status, urgency, lat, lng, radius, page = 1, limit = 50, sort_by = 'created_at', sort_order = 'DESC' } = req.query;

    let query = `
      SELECT r.id, r.issue_type, r.description, r.image_url, r.status, r.urgency,
        r.priority_score, r.upvote_count, r.ai_detected_class, r.ai_confidence,
        r.created_at, r.address_text, ST_Y(r.location) as latitude, ST_X(r.location) as longitude,
        u.display_name as reported_by_name
      FROM reports r LEFT JOIN users u ON r.reported_by = u.id WHERE 1=1
    `;
    const params = [];
    let pc = 0;

    if (issue_type) { pc++; query += ` AND r.issue_type = $${pc}`; params.push(issue_type); }
    if (status) { pc++; query += ` AND r.status = $${pc}`; params.push(status); }
    if (urgency) { pc++; query += ` AND r.urgency = $${pc}`; params.push(urgency); }

    // Fix #4: fully parameterized spatial filter
    if (lat && lng && radius) {
      pc++; const lngIdx = pc;
      pc++; const latIdx = pc;
      pc++; const radIdx = pc;
      query += ` AND ST_DWithin(r.location::geography, ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326)::geography, $${radIdx})`;
      params.push(parseFloat(lng), parseFloat(lat), parseFloat(radius));
    }

    const validSorts = ['created_at', 'priority_score', 'upvote_count'];
    const sortCol = validSorts.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY r.${sortCol} ${sortDir}`;

    pc++; query += ` LIMIT $${pc}`; params.push(parseInt(limit));
    pc++; query += ` OFFSET $${pc}`; params.push((parseInt(page) - 1) * parseInt(limit));

    const result = await db.query(query, params);

    return success(res, 200, 'Reports retrieved.', { reports: result.rows, pagination: { page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    logger.error(`Get reports failed: ${err.message}`);
    return error(res, 500, 'Failed to retrieve reports.');
  }
};

/**
 * GET /api/reports/geo/nearby — Fix #6: implemented
 */
exports.getNearbyReports = async (req, res) => {
  try {
    const { lat, lng, radius = 100, issue_type } = req.query;
    if (!lat || !lng) return error(res, 400, 'lat and lng are required.');

    const nearby = await spatialService.findNearbyReports(parseFloat(lat), parseFloat(lng), parseFloat(radius), issue_type || null);
    return success(res, 200, 'Nearby reports retrieved.', { reports: nearby });
  } catch (err) {
    logger.error(`Nearby reports failed: ${err.message}`);
    return error(res, 500, 'Failed to retrieve nearby reports.');
  }
};

/**
 * GET /api/reports/:id — Fix #6: implemented
 */
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT r.*, ST_Y(r.location) as latitude, ST_X(r.location) as longitude,
        u.full_name as reported_by_name, u.display_name as reported_by_display
      FROM reports r LEFT JOIN users u ON r.reported_by = u.id WHERE r.id = $1
    `, [id]);

    if (result.rows.length === 0) return error(res, 404, 'Report not found.');

    const upvotes = await db.query('SELECT COUNT(*) as count FROM upvotes WHERE report_id = $1', [id]);
    const userUpvoted = await db.query('SELECT id FROM upvotes WHERE report_id = $1 AND user_id = $2', [id, req.user.id]);

    return success(res, 200, 'Report retrieved.', {
      report: result.rows[0],
      upvote_count: parseInt(upvotes.rows[0].count),
      user_has_upvoted: userUpvoted.rows.length > 0,
    });
  } catch (err) {
    logger.error(`Get report failed: ${err.message}`);
    return error(res, 500, 'Failed to retrieve report.');
  }
};

/**
 * PATCH /api/reports/:id/status — Fix #6: implemented
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus, resolution_notes } = req.body;

    if (!newStatus) return error(res, 400, 'Status is required.');

    const validStatuses = ['pending', 'ai_verified', 'ai_rejected', 'under_review', 'confirmed', 'in_progress', 'volunteer_assigned', 'resolved', 'closed'];
    if (!validStatuses.includes(newStatus)) return error(res, 400, 'Invalid status.');

    const updates = ['status = $1'];
    const params = [newStatus];
    let pc = 1;

    if (newStatus === 'resolved') {
      updates.push('resolved_at = NOW()');
      pc++; updates.push(`resolved_by = $${pc}`); params.push(req.user.id);
    }
    if (resolution_notes) {
      pc++; updates.push(`resolution_notes = $${pc}`); params.push(resolution_notes);
    }

    pc++; params.push(id);
    const result = await db.query(
      `UPDATE reports SET ${updates.join(', ')} WHERE id = $${pc} RETURNING id, status, urgency, priority_score`,
      params
    );

    if (result.rows.length === 0) return error(res, 404, 'Report not found.');
    return success(res, 200, 'Status updated.', { report: result.rows[0] });
  } catch (err) {
    logger.error(`Update status failed: ${err.message}`);
    return error(res, 500, 'Failed to update status.');
  }
};
