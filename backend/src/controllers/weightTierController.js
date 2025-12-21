const { query } = require('../config/db');

// Get all weight-tier mappings
const getWeightTierMappings = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        weight,
        available_tiers,
        is_active,
        created_at,
        updated_at
      FROM weight_tier_mappings 
      WHERE is_active = 1
      ORDER BY 
        CASE 
          WHEN weight LIKE '%kg' THEN CAST(REPLACE(REPLACE(weight, 'kg', ''), ' ', '') AS REAL)
          WHEN weight LIKE '%g' THEN CAST(REPLACE(REPLACE(weight, 'g', ''), ' ', '') AS REAL) / 1000
          ELSE 0
        END ASC,
        weight ASC
    `);

    const mappings = result.rows.map(row => ({
      id: row.id,
      weight: row.weight,
      available_tiers: JSON.parse(row.available_tiers),
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    res.json({
      success: true,
      data: {
        mappings,
        total: mappings.length
      }
    });
  } catch (error) {
    console.error('Error fetching weight-tier mappings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weight-tier mappings',
      error: error.message
    });
  }
};

// Helper function to normalize weight for comparison
const normalizeWeight = (weight) => {
  return weight.toLowerCase().replace(/\s+/g, '').replace('gm', 'g');
};

// Get single weight-tier mapping by weight
const getWeightTierMappingByWeight = async (req, res) => {
  try {
    const { weight } = req.params;
    const normalizedWeight = normalizeWeight(weight);
    
    // First try exact match
    let result = await query(
      'SELECT * FROM weight_tier_mappings WHERE weight = ? AND is_active = 1',
      [weight]
    );

    // If no exact match, try normalized comparison
    if (result.rows.length === 0) {
      const allMappings = await query(
        'SELECT * FROM weight_tier_mappings WHERE is_active = 1'
      );
      
      const matchingMapping = allMappings.rows.find(mapping => 
        normalizeWeight(mapping.weight) === normalizedWeight
      );
      
      if (matchingMapping) {
        result.rows = [matchingMapping];
      }
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Weight-tier mapping not found'
      });
    }

    const mapping = result.rows[0];
    mapping.available_tiers = JSON.parse(mapping.available_tiers);

    res.json({
      success: true,
      data: { mapping }
    });
  } catch (error) {
    console.error('Error fetching weight-tier mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weight-tier mapping',
      error: error.message
    });
  }
};

// Update weight-tier mapping
const updateWeightTierMapping = async (req, res) => {
  try {
    const { id } = req.params;
    const { available_tiers } = req.body;

    // Validate input
    if (!available_tiers || !Array.isArray(available_tiers) || available_tiers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'available_tiers must be a non-empty array'
      });
    }

    // Validate tier values (should be numbers 1-4)
    const validTiers = available_tiers.every(tier => 
      Number.isInteger(tier) && tier >= 1 && tier <= 4
    );

    if (!validTiers) {
      return res.status(400).json({
        success: false,
        message: 'Tiers must be integers between 1 and 4'
      });
    }

    // Check if mapping exists
    const existingResult = await query(
      'SELECT id FROM weight_tier_mappings WHERE id = ?',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Weight-tier mapping not found'
      });
    }

    // Update the mapping
    const result = await query(
      'UPDATE weight_tier_mappings SET available_tiers = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(available_tiers), id]
    );

    if (result.changes === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes made'
      });
    }

    // Fetch updated mapping
    const updatedResult = await query(
      'SELECT * FROM weight_tier_mappings WHERE id = ?',
      [id]
    );

    const updatedMapping = updatedResult.rows[0];
    updatedMapping.available_tiers = JSON.parse(updatedMapping.available_tiers);

    res.json({
      success: true,
      message: 'Weight-tier mapping updated successfully',
      data: { mapping: updatedMapping }
    });
  } catch (error) {
    console.error('Error updating weight-tier mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update weight-tier mapping',
      error: error.message
    });
  }
};

// Create new weight-tier mapping
const createWeightTierMapping = async (req, res) => {
  try {
    const { weight, available_tiers } = req.body;

    // Validate input
    if (!weight || !available_tiers || !Array.isArray(available_tiers) || available_tiers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'weight and available_tiers (non-empty array) are required'
      });
    }

    // Validate tier values
    const validTiers = available_tiers.every(tier => 
      Number.isInteger(tier) && tier >= 1 && tier <= 4
    );

    if (!validTiers) {
      return res.status(400).json({
        success: false,
        message: 'Tiers must be integers between 1 and 4'
      });
    }

    // Check if weight already exists (exact match or normalized match)
    const existingResult = await query(
      'SELECT id FROM weight_tier_mappings WHERE weight = ?',
      [weight]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Weight-tier mapping already exists for this weight'
      });
    }

    // Also check for normalized duplicates
    const normalizedWeight = normalizeWeight(weight);
    const allMappings = await query(
      'SELECT id, weight FROM weight_tier_mappings'
    );
    
    const duplicateExists = allMappings.rows.some(mapping => 
      normalizeWeight(mapping.weight) === normalizedWeight
    );

    if (duplicateExists) {
      return res.status(400).json({
        success: false,
        message: 'A similar weight already exists (e.g., "1kg" vs "1 kg")'
      });
    }

    // Create new mapping
    const result = await query(
      'INSERT INTO weight_tier_mappings (weight, available_tiers) VALUES (?, ?)',
      [weight, JSON.stringify(available_tiers)]
    );

    // Fetch created mapping
    const createdResult = await query(
      'SELECT * FROM weight_tier_mappings WHERE id = ?',
      [result.lastID]
    );

    const createdMapping = createdResult.rows[0];
    createdMapping.available_tiers = JSON.parse(createdMapping.available_tiers);

    res.status(201).json({
      success: true,
      message: 'Weight-tier mapping created successfully',
      data: { mapping: createdMapping }
    });
  } catch (error) {
    console.error('Error creating weight-tier mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create weight-tier mapping',
      error: error.message
    });
  }
};

// Delete weight-tier mapping (soft delete)
const deleteWeightTierMapping = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE weight_tier_mappings SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Weight-tier mapping not found'
      });
    }

    res.json({
      success: true,
      message: 'Weight-tier mapping deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting weight-tier mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete weight-tier mapping',
      error: error.message
    });
  }
};

module.exports = {
  getWeightTierMappings,
  getWeightTierMappingByWeight,
  updateWeightTierMapping,
  createWeightTierMapping,
  deleteWeightTierMapping
};
