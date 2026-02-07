const { query } = require('../config/db');

const expectedSchema = {
  auth_refresh_tokens: [
    'id',
    'user_id',
    'token_id',
    'expires_at',
    'revoked_at',
    'last_used_at',
    'is_persistent',
    'created_at'
  ],
  token_blacklist: [
    'id',
    'token_id',
    'expires_at',
    'created_at'
  ],
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

const ensureAuthRefreshTokensTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      token_id VARCHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      revoked_at DATETIME NULL,
      last_used_at DATETIME NULL,
      is_persistent BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_auth_refresh_tokens_user_id (user_id),
      INDEX idx_auth_refresh_tokens_expires_at (expires_at)
    )
  `);
};

const ensureTokenBlacklistTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      id INT PRIMARY KEY AUTO_INCREMENT,
      token_id VARCHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_token_blacklist_expires_at (expires_at)
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
    if (!existingTables.has(tableName)) {
      if (tableName === 'weight_tier_mappings') {
        await ensureWeightTierMappingsTable();
        existingTables.add(tableName);
      }
      if (tableName === 'auth_refresh_tokens') {
        await ensureAuthRefreshTokensTable();
        existingTables.add(tableName);
      }
      if (tableName === 'token_blacklist') {
        await ensureTokenBlacklistTable();
        existingTables.add(tableName);
      }
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
