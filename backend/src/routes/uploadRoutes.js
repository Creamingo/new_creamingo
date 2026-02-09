const express = require('express');
const router = express.Router();
const {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  getFileInfo
} = require('../controllers/uploadController');
const { authMiddleware } = require('../middleware/auth');
const { requireStaff } = require('../middleware/role');
const { uploadSingle: uploadSingleMiddleware, uploadMultiple: uploadMultipleMiddleware, handleUploadError } = require('../middleware/upload');

// Protected routes (staff and super admin only)
router.post('/single', authMiddleware, requireStaff, uploadSingleMiddleware('image'), handleUploadError, uploadSingle);
router.post('/multiple', authMiddleware, requireStaff, uploadMultipleMiddleware('images', 10), handleUploadError, uploadMultiple);
router.get('/:filename', authMiddleware, requireStaff, getFileInfo);
router.delete('/:filename', authMiddleware, requireStaff, deleteFile);

module.exports = router;
