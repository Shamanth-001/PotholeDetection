/**
 * Report Routes — Fix #7: /geo/nearby BEFORE /:id to avoid param capture
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `report_${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage, limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(allowed.includes(file.mimetype) ? null : new Error('Invalid file type. Only JPEG, PNG, WebP allowed.'), allowed.includes(file.mimetype));
  },
});

// Fix #7: static routes BEFORE parameterized routes
router.get('/geo/nearby', auth, reportController.getNearbyReports);
router.get('/', auth, reportController.getReports);
router.post('/', auth, upload.single('image'), reportController.createReport);
router.get('/:id', auth, reportController.getReportById);
router.post('/:id/upvote', auth, reportController.upvoteReport);
router.patch('/:id/status', auth, reportController.updateStatus);

module.exports = router;
