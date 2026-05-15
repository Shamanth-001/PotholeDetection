/**
 * API Route Aggregator
 */
const express = require('express');
const router = express.Router();

router.use('/public', require('./publicRoutes'));
router.use('/auth', require('./authRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/volunteer', require('./volunteerRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;
