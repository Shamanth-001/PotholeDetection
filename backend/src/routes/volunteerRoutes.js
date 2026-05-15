const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const volunteerController = require('../controllers/volunteerController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
    filename: (req, file, cb) => cb(null, `solution_${uuidv4()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/drives', auth, volunteerController.listDrives);
router.get('/drives/:id', auth, volunteerController.getDriveDetails);
router.post('/drives', auth, roleGuard(['volunteer', 'admin']), volunteerController.createDrive);
router.post('/drives/:id/register', auth, volunteerController.registerForDrive);
router.post('/drives/:id/unregister', auth, volunteerController.unregisterFromDrive);
router.post('/drives/:id/solution', auth, upload.single('solution_image'), volunteerController.uploadSolution);
router.get('/certificates', auth, volunteerController.getUserCertificates);
router.get('/certificates/:id/download', auth, volunteerController.downloadCertificate);

module.exports = router;
