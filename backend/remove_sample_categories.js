const { db } = require('./src/config/db');

const removeSampleCategories = async () => {
  try {
    console.log('🗑️ Removing sample/test categories (IDs 1, 2, 3)...\n');
    
    // First, let's check what we're about to delete
    const categories = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, name, description 
        FROM categories 
        WHERE id IN (1, 2, 3) 
        ORDER BY id
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    
    console.log('📋 Categories to be removed:');
    categories.forEach(cat => {
      console.log(`   - ID ${cat.id}: ${cat.name}`);
    });
    
    // Check for any dependencies
    console.log('\n🔍 Checking for dependencies...');
    
    for (const category of categories) {
      // Check subcategories
      const subcategories = await new Promise((resolve, reject) => {
        db.all(`
          SELECT COUNT(*) as count 
          FROM subcategories 
          WHERE category_id = ?
        `, [category.id], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows[0].count);
          }
        });
      });
      
      // Check products
      const products = await new Promise((resolve, reject) => {
        db.all(`
          SELECT COUNT(*) as count 
          FROM products 
          WHERE category_id = ?
        `, [category.id], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows[0].count);
          }
        });
      });
      
      // Check featured categories
      const featured = await new Promise((resolve, reject) => {
        db.all(`
          SELECT COUNT(*) as count 
          FROM featured_categories 
          WHERE category_id = ?
        `, [category.id], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows[0].count);
          }
        });
      });
      
      console.log(`\n📊 ${category.name} (ID: ${category.id}):`);
      console.log(`   - Subcategories: ${subcategories}`);
      console.log(`   - Products: ${products}`);
      console.log(`   - Featured references: ${featured}`);
      
      if (subcategories > 0 || products > 0 || featured > 0) {
        console.log(`   ⚠️  WARNING: This category has dependencies!`);
      } else {
        console.log(`   ✅ Safe to delete (no dependencies)`);
      }
    }
    
    // Confirm deletion
    console.log('\n❓ Do you want to proceed with deletion? (This will remove categories 1, 2, 3 and their subcategories)');
    console.log('   Note: This action cannot be undone!');
    
    // For safety, we'll use a flag to control deletion
    const shouldDelete = process.argv.includes('--confirm');
    
    if (!shouldDelete) {
      console.log('\n🛡️  Deletion not confirmed. To proceed, run:');
      console.log('   node remove_sample_categories.js --confirm');
      return;
    }
    
    console.log('\n🗑️ Proceeding with deletion...');
    
    // Delete in order: subcategories first (due to foreign key constraints)
    for (const category of categories) {
      console.log(`\n🗑️ Deleting subcategories for ${category.name}...`);
      await new Promise((resolve, reject) => {
        db.run(`
          DELETE FROM subcategories 
          WHERE category_id = ?
        `, [category.id], function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`   ✅ Deleted ${this.changes} subcategories`);
            resolve();
          }
        });
      });
    }
    
    // Delete the categories
    for (const category of categories) {
      console.log(`\n🗑️ Deleting category: ${category.name}...`);
      await new Promise((resolve, reject) => {
        db.run(`
          DELETE FROM categories 
          WHERE id = ?
        `, [category.id], function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`   ✅ Deleted category ID ${category.id}`);
            resolve();
          }
        });
      });
    }
    
    // Update order_index for remaining categories to be sequential
    console.log('\n🔄 Updating order_index for remaining categories...');
    const remainingCategories = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id 
        FROM categories 
        ORDER BY order_index ASC
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    
    for (let i = 0; i < remainingCategories.length; i++) {
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE categories 
          SET order_index = ? 
          WHERE id = ?
        `, [i + 1, remainingCategories[i].id], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
    
    console.log(`   ✅ Updated order_index for ${remainingCategories.length} remaining categories`);
    
    // Show final category list
    console.log('\n📊 Final category list:');
    const finalCategories = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, name, order_index 
        FROM categories 
        ORDER BY order_index ASC
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    
    finalCategories.forEach(cat => {
      console.log(`   ${cat.order_index}. ${cat.name} (ID: ${cat.id})`);
    });
    
    console.log('\n✅ Sample categories removed successfully!');
    
  } catch (error) {
    console.error('❌ Error removing categories:', error);
  }
};

removeSampleCategories().then(() => {
  console.log('\n🎉 Cleanup completed!');
  process.exit(0);
});
