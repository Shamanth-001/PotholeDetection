const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

router.use(auth);
router.use(roleGuard(['admin']));

router.get('/heatmap-data', adminController.getHeatmapData);
router.get('/analytics', adminController.getAnalytics);
router.get('/ward-stats', adminController.getWardStatistics);
router.get('/reports', adminController.getAllReports);
router.patch('/reports/:id', adminController.updateReport);
router.get('/users', adminController.getUsers);
router.get('/export', adminController.exportReports);
router.post('/refresh-analytics', adminController.refreshAnalytics);
router.post('/drives', adminController.createDrive);

module.exports = router;
