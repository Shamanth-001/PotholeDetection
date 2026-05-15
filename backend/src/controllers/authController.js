/**
 * Authentication Controller
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
const JWT_EXPIRES_IN = '7d';

exports.register = async (req, res) => {
  try {
    const { email, password, full_name, display_name, role } = req.body;
    if (!email || !password || !full_name) return error(res, 400, 'Email, password, and full name are required.');
    if (password.length < 8) return error(res, 400, 'Password must be at least 8 characters.');

    // Strict email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return error(res, 400, 'Please enter a valid email address.');

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) return error(res, 409, 'An account with this email already exists.');

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const allowedRole = 'citizen'; // All users register as citizen — volunteer is a feature, not a role

    const result = await db.query(`
      INSERT INTO users (id, email, password_hash, full_name, display_name, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, full_name, display_name, role, points, created_at
    `, [userId, email.toLowerCase(), passwordHash, full_name, display_name || full_name.split(' ')[0], allowedRole]);

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    logger.info(`New user: ${user.email} (${user.role})`);
    return success(res, 201, 'Registration successful!', { user, token, expires_in: JWT_EXPIRES_IN });
  } catch (err) {
    logger.error(`Registration failed: ${err.message}`);
    return error(res, 500, 'Registration failed.');
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 400, 'Email and password are required.');

    const result = await db.query(
      'SELECT id, email, password_hash, full_name, display_name, role, points, avatar_url FROM users WHERE email = $1 AND is_active = TRUE',
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) return error(res, 401, 'Invalid email or password.');

    const user = result.rows[0];
    if (!(await bcrypt.compare(password, user.password_hash))) return error(res, 401, 'Invalid email or password.');

    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    delete user.password_hash;

    return success(res, 200, 'Login successful!', { user, token, expires_in: JWT_EXPIRES_IN });
  } catch (err) {
    logger.error(`Login failed: ${err.message}`);
    return error(res, 500, 'Login failed.');
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return error(res, 400, 'Token is required.');
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    const result = await db.query('SELECT id, email, role FROM users WHERE id = $1 AND is_active = TRUE', [decoded.id]);
    if (result.rows.length === 0) return error(res, 401, 'User not found.');
    const user = result.rows[0];
    const newToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return success(res, 200, 'Token refreshed.', { token: newToken });
  } catch (err) { return error(res, 401, 'Invalid token.'); }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, email, full_name, display_name, avatar_url, role, points,
        reports_submitted, reports_verified, upvotes_given, certificates_earned,
        volunteer_hours, created_at
      FROM users WHERE id = $1
    `, [req.user.id]);
    if (result.rows.length === 0) return error(res, 404, 'User not found.');
    return success(res, 200, 'Profile retrieved.', { user: result.rows[0] });
  } catch (err) { return error(res, 500, 'Failed to retrieve profile.'); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { full_name, display_name, phone, latitude, longitude } = req.body;
    const fields = []; const params = []; let pc = 0;
    if (full_name) { pc++; fields.push(`full_name = $${pc}`); params.push(full_name); }
    if (display_name) { pc++; fields.push(`display_name = $${pc}`); params.push(display_name); }
    if (phone) { pc++; fields.push(`phone = $${pc}`); params.push(phone); }
    if (latitude && longitude) { pc++; fields.push(`home_location = ST_SetSRID(ST_MakePoint($${pc}, $${pc + 1}), 4326)`); params.push(parseFloat(longitude), parseFloat(latitude)); pc++; }
    if (fields.length === 0) return error(res, 400, 'No fields to update.');
    pc++; params.push(req.user.id);
    const result = await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${pc} RETURNING id, email, full_name, display_name, role, points`, params);
    return success(res, 200, 'Profile updated.', { user: result.rows[0] });
  } catch (err) { return error(res, 500, 'Failed to update profile.'); }
};
