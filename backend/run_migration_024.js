const fs = require('fs');
const path = require('path');
const { query } = require('./src/config/db');

async function runMigration() {
  try {
    console.log('Starting migration 024: Add product category junction tables...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', '024_add_product_category_junction_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements, handling multi-line statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt.replace(/\s+/g, ' ').trim());
    
    console.log(`Found ${statements.length} statements to execute:`);
    statements.forEach((stmt, index) => {
      console.log(`${index + 1}. ${stmt.substring(0, 100)}...`);
    });
    console.log('');
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 100)}...`);
        try {
          await query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}: ${statement.substring(0, 100)}...`);
          console.error('Error:', error.message);
          throw error;
        }
      }
    }
    
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
runMigration();
