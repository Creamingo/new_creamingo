const express = require('express');
const router = express.Router();
const { getSchemaHealth } = require('../controllers/schemaHealthController');

// Schema health endpoint
router.get('/', getSchemaHealth);

module.exports = router;
