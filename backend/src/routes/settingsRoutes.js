const express = require('express');
const router = express.Router();
const {
  getSettings,
  getSetting,
  updateSettings,
  updateSetting,
  deleteSetting
} = require('../controllers/settingsController');
const { authMiddleware } = require('../middleware/auth');
const { canManageSettings } = require('../middleware/role');
const { validate, schemas } = require('../middleware/validation');

// Public routes
router.get('/', getSettings);
router.get('/:key', getSetting);

// Protected routes (super admin only)
router.put('/', authMiddleware, canManageSettings, validate(schemas.updateSettings), updateSettings);
router.put('/:key', authMiddleware, canManageSettings, updateSetting);
router.delete('/:key', authMiddleware, canManageSettings, deleteSetting);

module.exports = router;
