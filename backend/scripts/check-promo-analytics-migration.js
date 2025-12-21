/**
 * Script to check if promo code analytics migration has been run
 * Run this to verify the analytics tables exist
 */

const { query } = require('../src/config/db');

async function checkMigration() {
  try {
    console.log('Checking promo code analytics tables...\n');
    
    // Check if promo_code_analytics table exists
    try {
      await query('SELECT 1 FROM promo_code_analytics LIMIT 1');
      console.log('✅ promo_code_analytics table exists');
    } catch (error) {
      console.log('❌ promo_code_analytics table does NOT exist');
      console.log('   Please run migration: 054_create_promo_code_analytics.sql\n');
      return false;
    }
    
    // Check if promo_code_performance_cache table exists
    try {
      await query('SELECT 1 FROM promo_code_performance_cache LIMIT 1');
      console.log('✅ promo_code_performance_cache table exists');
    } catch (error) {
      console.log('❌ promo_code_performance_cache table does NOT exist');
      console.log('   Please run migration: 054_create_promo_code_analytics.sql\n');
      return false;
    }
    
    // Check if there's any data
    const analyticsCount = await query('SELECT COUNT(*) as count FROM promo_code_analytics');
    const count = analyticsCount.rows?.[0]?.count || analyticsCount[0]?.count || 0;
    
    console.log(`\n📊 Analytics data: ${count} events tracked`);
    
    if (count === 0) {
      console.log('\n💡 No analytics data yet. Data will appear when:');
      console.log('   - Users view promo codes');
      console.log('   - Users validate promo codes');
      console.log('   - Users apply promo codes to cart');
      console.log('   - Users complete orders with promo codes');
    }
    
    console.log('\n✅ All checks passed!');
    return true;
  } catch (error) {
    console.error('Error checking migration:', error);
    return false;
  }
}

// Run the check
checkMigration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
