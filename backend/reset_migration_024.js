const { query } = require('./src/config/db');

async function resetMigration() {
  try {
    console.log('Resetting migration 024...');
    
    // Drop existing tables and triggers
    console.log('Dropping existing tables and triggers...');
    try {
      await query('DROP TRIGGER IF EXISTS update_product_categories_updated_at');
      await query('DROP TRIGGER IF EXISTS update_product_subcategories_updated_at');
      await query('DROP TABLE IF EXISTS product_categories');
      await query('DROP TABLE IF EXISTS product_subcategories');
      console.log('✅ Existing tables and triggers dropped');
    } catch (error) {
      console.log('No existing tables to drop');
    }
    
    // Create product_categories junction table
    console.log('Creating product_categories table...');
    await query(`
      CREATE TABLE product_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        is_primary BOOLEAN DEFAULT 0,
        display_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, category_id)
      )
    `);
    console.log('✅ product_categories table created');

    // Create product_subcategories junction table
    console.log('Creating product_subcategories table...');
    await query(`
      CREATE TABLE product_subcategories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        subcategory_id INTEGER NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
        is_primary BOOLEAN DEFAULT 0,
        display_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, subcategory_id)
      )
    `);
    console.log('✅ product_subcategories table created');

    // Add indexes
    console.log('Creating indexes...');
    await query('CREATE INDEX idx_product_categories_product ON product_categories(product_id)');
    await query('CREATE INDEX idx_product_categories_category ON product_categories(category_id)');
    await query('CREATE INDEX idx_product_categories_primary ON product_categories(is_primary)');
    await query('CREATE INDEX idx_product_subcategories_product ON product_subcategories(product_id)');
    await query('CREATE INDEX idx_product_subcategories_subcategory ON product_subcategories(subcategory_id)');
    await query('CREATE INDEX idx_product_subcategories_primary ON product_subcategories(is_primary)');
    console.log('✅ Indexes created');

    // Migrate existing data
    console.log('Migrating existing category data...');
    await query(`
      INSERT INTO product_categories (product_id, category_id, is_primary, display_order)
      SELECT id, category_id, 1, 1
      FROM products 
      WHERE category_id IS NOT NULL
    `);
    console.log('✅ Category data migrated');

    console.log('Migrating existing subcategory data...');
    await query(`
      INSERT INTO product_subcategories (product_id, subcategory_id, is_primary, display_order)
      SELECT p.id, p.subcategory_id, 1, 1
      FROM products p
      INNER JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.subcategory_id IS NOT NULL
    `);
    console.log('✅ Subcategory data migrated');

    // Create triggers
    console.log('Creating triggers...');
    await query(`
      CREATE TRIGGER update_product_categories_updated_at 
        AFTER UPDATE ON product_categories 
        FOR EACH ROW 
        BEGIN
          UPDATE product_categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
    `);
    
    await query(`
      CREATE TRIGGER update_product_subcategories_updated_at 
        AFTER UPDATE ON product_subcategories 
        FOR EACH ROW 
        BEGIN
          UPDATE product_subcategories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
    `);
    console.log('✅ Triggers created');

    console.log('Migration 024 completed successfully!');
    
    // Verify the migration
    const productCategoriesCount = await query('SELECT COUNT(*) as count FROM product_categories');
    const productSubcategoriesCount = await query('SELECT COUNT(*) as count FROM product_subcategories');
    
    console.log(`Created ${productCategoriesCount.rows[0].count} product-category relationships`);
    console.log(`Created ${productSubcategoriesCount.rows[0].count} product-subcategory relationships`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
resetMigration();
