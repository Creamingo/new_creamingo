const express = require('express');
const router = express.Router();
const {
  getWeightTierMappings,
  getWeightTierMappingByWeight,
  updateWeightTierMapping,
  createWeightTierMapping,
  deleteWeightTierMapping
} = require('../controllers/weightTierController');

// Get all weight-tier mappings
router.get('/', getWeightTierMappings);

// Get weight-tier mapping by weight
router.get('/weight/:weight', getWeightTierMappingByWeight);

// Create new weight-tier mapping
router.post('/', createWeightTierMapping);

// Update weight-tier mapping
router.put('/:id', updateWeightTierMapping);

// Delete weight-tier mapping (soft delete)
router.delete('/:id', deleteWeightTierMapping);

module.exports = router;
