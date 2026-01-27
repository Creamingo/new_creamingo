const { query } = require('../config/db');

const expectedSchema = {
  products: [
    'id',
    'name',
    'slug',
    'category_id',
    'subcategory_id',
    'base_price',
    'discount_percent',
    'discounted_price',
    'image_url',
    'rating',
    'review_count',
    'is_top_product',
    'is_bestseller',
    'is_new_launch',
    'is_trending',
    'is_featured',
    'is_active'
  ],
  categories: ['id', 'name'],
  subcategories: ['id', 'name'],
  product_reviews: [
    'id',
    'product_id',
    'rating',
    'review_text',
    'is_approved',
    'created_at'
  ],
  product_review_images: ['review_id', 'image_url', 'display_order'],
  weight_tier_mappings: [
    'id',
    'weight',
    'available_tiers',
    'is_active',
    'created_at',
    'updated_at'
  ]
};

const ensureWeightTierMappingsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS weight_tier_mappings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      weight VARCHAR(50) NOT NULL UNIQUE,
      available_tiers TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const runSchemaHealthCheck = async () => {
  const results = {};
  const tables = Object.keys(expectedSchema);

  const tablesResult = await query(
    `
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${tables.map(() => '?').join(',')})
    `,
    tables
  );

  const existingTables = new Set((tablesResult.rows || []).map(row => row.TABLE_NAME));

  for (const tableName of tables) {
    if (!existingTables.has(tableName) && tableName === 'weight_tier_mappings') {
      await ensureWeightTierMappingsTable();
      existingTables.add(tableName);
    }

    if (!existingTables.has(tableName)) {
      results[tableName] = {
        exists: false,
        missingColumns: expectedSchema[tableName]
      };
      continue;
    }

    const columnsResult = await query(
      `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      `,
      [tableName]
    );

    const existingColumns = new Set((columnsResult.rows || []).map(row => row.COLUMN_NAME));
    const missingColumns = expectedSchema[tableName].filter(column => !existingColumns.has(column));

    results[tableName] = {
      exists: true,
      missingColumns
    };
  }

  const hasIssues = Object.values(results).some(
    entry => !entry.exists || entry.missingColumns.length > 0
  );

  return {
    ok: !hasIssues,
    tables: results
  };
};

const getSchemaHealth = async (req, res) => {
  try {
    const data = await runSchemaHealthCheck();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Schema health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check schema health',
      error: error.message
    });
  }
};

module.exports = {
  getSchemaHealth,
  runSchemaHealthCheck
};
