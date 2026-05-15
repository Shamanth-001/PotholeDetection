/**
 * Volunteer Controller — Drive management and certificate generation
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseHelper');
const pdfGenerator = require('../utils/pdfGenerator');

exports.listDrives = async (req, res) => {
  try {
    const { status, issue_type, upcoming_only } = req.query;
    const userId = req.user.id;

    // pc=1 reserved for userId (used in the LEFT JOIN subquery)
    let query = `
      SELECT vd.id, vd.title, vd.description, vd.address_text, vd.meeting_point_description,
        vd.scheduled_date, vd.start_time, vd.end_time, vd.max_volunteers, vd.current_volunteers,
        vd.min_volunteers, vd.status, vd.target_issue_type,
        ST_Y(vd.location) as latitude, ST_X(vd.location) as longitude,
        u.full_name as organizer_name, vd.created_at,
        CASE WHEN dv.user_id IS NOT NULL THEN true ELSE false END as user_registered
      FROM volunteer_drives vd
      LEFT JOIN users u ON vd.organized_by = u.id
      LEFT JOIN drive_volunteers dv ON dv.drive_id = vd.id AND dv.user_id = $1
      WHERE 1=1
    `;
    const params = [userId]; let pc = 1;
    if (status) { pc++; query += ` AND vd.status = $${pc}`; params.push(status); }
    if (issue_type) { pc++; query += ` AND vd.target_issue_type = $${pc}`; params.push(issue_type); }
    if (upcoming_only === 'true') query += ` AND vd.scheduled_date >= CURRENT_DATE`;
    query += ` ORDER BY vd.scheduled_date ASC`;
    const result = await db.query(query, params);
    return success(res, 200, 'Drives retrieved.', { drives: result.rows });
  } catch (err) { logger.error(`List drives: ${err.message}`); return error(res, 500, 'Failed to retrieve drives.'); }
};

exports.getDriveDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const drive = await db.query(`
      SELECT vd.*, ST_Y(vd.location) as latitude, ST_X(vd.location) as longitude, u.full_name as organizer_name
      FROM volunteer_drives vd LEFT JOIN users u ON vd.organized_by = u.id WHERE vd.id = $1
    `, [id]);
    if (drive.rows.length === 0) return error(res, 404, 'Drive not found.');
    const volunteers = await db.query(`
      SELECT dv.user_id, dv.registered_at, dv.attended, u.full_name, u.display_name, u.avatar_url
      FROM drive_volunteers dv JOIN users u ON dv.user_id = u.id WHERE dv.drive_id = $1 ORDER BY dv.registered_at ASC
    `, [id]);
    const registered = await db.query('SELECT id FROM drive_volunteers WHERE drive_id = $1 AND user_id = $2', [id, req.user.id]);
    return success(res, 200, 'Drive details.', { drive: drive.rows[0], volunteers: volunteers.rows, user_registered: registered.rows.length > 0 });
  } catch (err) { return error(res, 500, 'Failed to retrieve drive details.'); }
};

exports.createDrive = async (req, res) => {
  try {
    const { title, description, latitude, longitude, address_text, meeting_point_description, scheduled_date, start_time, end_time, max_volunteers, min_volunteers, target_issue_type, linked_report_ids } = req.body;
    if (!title || !latitude || !longitude || !scheduled_date || !start_time) return error(res, 400, 'Title, location, date, and start time required.');
    const driveId = uuidv4();
    const result = await db.query(`
      INSERT INTO volunteer_drives (id, title, description, location, address_text, meeting_point_description,
        scheduled_date, start_time, end_time, max_volunteers, min_volunteers, status, target_issue_type, linked_report_ids, organized_by)
      VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8, $9, $10, $11, $12, 'open_for_registration', $13, $14, $15)
      RETURNING id, title, scheduled_date, status, max_volunteers, current_volunteers
    `, [driveId, title, description, parseFloat(longitude), parseFloat(latitude), address_text, meeting_point_description, scheduled_date, start_time, end_time || null, max_volunteers || 20, min_volunteers || 3, target_issue_type || null, linked_report_ids || '{}', req.user.id]);

    if (linked_report_ids && linked_report_ids.length > 0) {
      await db.query(`UPDATE reports SET volunteer_drive_id = $1, status = 'volunteer_assigned' WHERE id = ANY($2) AND status NOT IN ('resolved','closed')`, [driveId, linked_report_ids]);
    }
    return success(res, 201, 'Drive created!', { drive: result.rows[0] });
  } catch (err) { logger.error(`Create drive: ${err.message}`); return error(res, 500, 'Failed to create drive.'); }
};

exports.registerForDrive = async (req, res) => {
  try {
    const { id: driveId } = req.params;
    const userId = req.user.id;
    const drive = await db.query('SELECT id, status, max_volunteers, current_volunteers FROM volunteer_drives WHERE id = $1', [driveId]);
    if (drive.rows.length === 0) return error(res, 404, 'Drive not found.');
    if (drive.rows[0].status !== 'open_for_registration') return error(res, 400, 'Not accepting registrations.');
    if (drive.rows[0].current_volunteers >= drive.rows[0].max_volunteers) return error(res, 400, 'Drive is full.');
    const existing = await db.query('SELECT id FROM drive_volunteers WHERE drive_id = $1 AND user_id = $2', [driveId, userId]);
    if (existing.rows.length > 0) return error(res, 409, 'Already registered.');

    await db.query('INSERT INTO drive_volunteers (id, drive_id, user_id) VALUES ($1, $2, $3)', [uuidv4(), driveId, userId]);
    const updated = await db.query(`
      UPDATE volunteer_drives SET current_volunteers = current_volunteers + 1,
        status = CASE WHEN current_volunteers + 1 >= max_volunteers THEN 'full'::drive_status ELSE status END
      WHERE id = $1 RETURNING current_volunteers, max_volunteers, status
    `, [driveId]);
    await db.query('UPDATE users SET points = points + 5 WHERE id = $1', [userId]);
    return success(res, 200, 'Registered!', { ...updated.rows[0], points_earned: 5 });
  } catch (err) { logger.error(`Register drive: ${err.message}`); return error(res, 500, 'Failed to register.'); }
};

exports.unregisterFromDrive = async (req, res) => {
  try {
    const { id: driveId } = req.params;
    const deleted = await db.query('DELETE FROM drive_volunteers WHERE drive_id = $1 AND user_id = $2 RETURNING id', [driveId, req.user.id]);
    if (deleted.rows.length === 0) return error(res, 404, 'Not registered.');
    await db.query(`UPDATE volunteer_drives SET current_volunteers = GREATEST(current_volunteers - 1, 0),
      status = CASE WHEN status = 'full' THEN 'open_for_registration'::drive_status ELSE status END WHERE id = $1`, [driveId]);
    return success(res, 200, 'Registration cancelled.');
  } catch (err) { return error(res, 500, 'Failed to cancel.'); }
};

exports.uploadSolution = async (req, res) => {
  try {
    const { id: driveId } = req.params;
    const userId = req.user.id;
    const imageFile = req.file;
    if (!imageFile) return error(res, 400, 'Solution image required.');

    const reg = await db.query('SELECT id FROM drive_volunteers WHERE drive_id = $1 AND user_id = $2', [driveId, userId]);
    if (reg.rows.length === 0) return error(res, 403, 'Not registered for this drive.');

    const drive = await db.query('SELECT * FROM volunteer_drives WHERE id = $1', [driveId]);
    if (drive.rows.length === 0) return error(res, 404, 'Drive not found.');
    const driveData = drive.rows[0];
    const solutionUrl = `/uploads/${imageFile.filename}`;

    let aiVerified = true, aiConfidence = 0;
    try {
      const aiResult = await aiService.analyzeImage(imageFile.path);
      aiConfidence = aiResult.confidence;
      aiVerified = aiResult.confidence < 0.5;
    } catch (e) { logger.warn(`AI unavailable for solution: ${e.message}`); }

    await db.query('UPDATE volunteer_drives SET after_image_url = $1, status = $2 WHERE id = $3', [solutionUrl, 'completed', driveId]);
    await db.query(`UPDATE drive_volunteers SET attended = TRUE, check_out_time = NOW(), hours_contributed = $1 WHERE drive_id = $2 AND user_id = $3`, [driveData.estimated_duration_hours || 2, driveId, userId]);

    if (driveData.linked_report_ids && driveData.linked_report_ids.length > 0) {
      await db.query(`UPDATE reports SET status = 'resolved', resolved_at = NOW(), resolved_by = $1, resolution_image_url = $2 WHERE id = ANY($3)`, [userId, solutionUrl, driveData.linked_report_ids]);
    }

    const userResult = await db.query('SELECT full_name FROM users WHERE id = $1', [userId]);
    const cert = await db.query(`
      INSERT INTO certificates (user_id, user_name, drive_id, issue_addressed, location_text, activity_date, hours_contributed, verified_by_ai, solution_image_url, ai_verification_confidence)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, certificate_number, title, issued_at
    `, [userId, userResult.rows[0].full_name, driveId, `${driveData.target_issue_type || 'Civic'} cleanup: ${driveData.title}`, driveData.address_text, new Date().toISOString().split('T')[0], driveData.estimated_duration_hours || 2, aiVerified, solutionUrl, aiConfidence]);

    const pdfUrl = await pdfGenerator.generateCertificate({
      certificateNumber: cert.rows[0].certificate_number, userName: userResult.rows[0].full_name,
      issueAddressed: driveData.title, location: driveData.address_text, date: new Date().toLocaleDateString(), hours: driveData.estimated_duration_hours || 2,
    });
    await db.query('UPDATE certificates SET pdf_url = $1 WHERE id = $2', [pdfUrl, cert.rows[0].id]);
    await db.query('UPDATE users SET points = points + 100, volunteer_hours = volunteer_hours + $1 WHERE id = $2', [driveData.estimated_duration_hours || 2, userId]);

    return success(res, 201, 'Solution verified! Certificate generated.', { ai_verified: aiVerified, certificate: { ...cert.rows[0], pdf_url: pdfUrl }, points_earned: 100 });
  } catch (err) { logger.error(`Solution upload: ${err.message}`); return error(res, 500, 'Failed to process solution.'); }
};

exports.getUserCertificates = async (req, res) => {
  try {
    const result = await db.query(`SELECT id, certificate_number, title, issue_addressed, location_text, activity_date, hours_contributed, verified_by_ai, pdf_url, issued_at FROM certificates WHERE user_id = $1 AND revoked = FALSE ORDER BY issued_at DESC`, [req.user.id]);
    return success(res, 200, 'Certificates retrieved.', { certificates: result.rows });
  } catch (err) { return error(res, 500, 'Failed to retrieve certificates.'); }
};

exports.downloadCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT pdf_url, certificate_number FROM certificates WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (result.rows.length === 0) return error(res, 404, 'Certificate not found.');
    if (!result.rows[0].pdf_url) return error(res, 404, 'PDF not yet generated.');
    res.download(result.rows[0].pdf_url, `CivicLens_${result.rows[0].certificate_number}.pdf`);
  } catch (err) { return error(res, 500, 'Failed to download certificate.'); }
};
