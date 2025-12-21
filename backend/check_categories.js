const { db } = require('./src/config/db');

const checkCategories = async () => {
  try {
    console.log('🔍 Checking categories with IDs 1, 2, 3...\n');
    
    // Get the specific categories
    const categories = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, name, description, image_url, order_index, created_at 
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
    
    console.log('📋 Categories found:');
    categories.forEach(cat => {
      console.log(`\nID: ${cat.id}`);
      console.log(`Name: ${cat.name}`);
      console.log(`Description: ${cat.description}`);
      console.log(`Image URL: ${cat.image_url}`);
      console.log(`Order Index: ${cat.order_index}`);
      console.log(`Created: ${cat.created_at}`);
    });
    
    // Check if these categories have any subcategories
    console.log('\n🔍 Checking for subcategories...');
    for (const category of categories) {
      const subcategories = await new Promise((resolve, reject) => {
        db.all(`
          SELECT id, name, description 
          FROM subcategories 
          WHERE category_id = ?
        `, [category.id], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
      
      if (subcategories.length > 0) {
        console.log(`\n📁 ${category.name} has ${subcategories.length} subcategories:`);
        subcategories.forEach(sub => {
          console.log(`   - ${sub.name}: ${sub.description}`);
        });
      } else {
        console.log(`\n📁 ${category.name} has no subcategories`);
      }
    }
    
    // Check if these categories have any products
    console.log('\n🔍 Checking for products...');
    for (const category of categories) {
      const products = await new Promise((resolve, reject) => {
        db.all(`
          SELECT id, name, description, base_price 
          FROM products 
          WHERE category_id = ?
        `, [category.id], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
      
      if (products.length > 0) {
        console.log(`\n🛍️ ${category.name} has ${products.length} products:`);
        products.forEach(product => {
          console.log(`   - ${product.name}: ₹${product.base_price}`);
        });
      } else {
        console.log(`\n🛍️ ${category.name} has no products`);
      }
    }
    
    // Check if these categories are referenced in featured_categories
    console.log('\n🔍 Checking for featured category references...');
    for (const category of categories) {
      const featured = await new Promise((resolve, reject) => {
        db.get(`
          SELECT id, display_order, is_active 
          FROM featured_categories 
          WHERE category_id = ?
        `, [category.id], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });
      
      if (featured) {
        console.log(`\n⭐ ${category.name} is featured (display_order: ${featured.display_order}, active: ${featured.is_active})`);
      } else {
        console.log(`\n⭐ ${category.name} is not featured`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking categories:', error);
  }
};

checkCategories().then(() => {
  console.log('\n✅ Category check completed!');
  process.exit(0);
});
