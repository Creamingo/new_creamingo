/**
 * Backfill script for promo code analytics
 * Populates analytics tables with historical order data
 * 
 * Usage: node scripts/backfill-promo-code-analytics.js
 */

const { query } = require('../src/config/db');

// Copy the updatePromoCodePerformanceCache function for use in backfill
async function updatePromoCodePerformanceCache(promoCodeId) {
  try {
    // Get aggregated analytics for this promo code
    const analyticsQuery = `
      SELECT 
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as total_views,
        COUNT(CASE WHEN event_type = 'validate' THEN 1 END) as total_validations,
        COUNT(CASE WHEN event_type = 'validate' AND validation_result = 'success' THEN 1 END) as successful_validations,
        COUNT(CASE WHEN event_type = 'validate' AND validation_result = 'failed' THEN 1 END) as failed_validations,
        COUNT(CASE WHEN event_type = 'apply' THEN 1 END) as total_applications,
        COUNT(CASE WHEN event_type = 'redeem' THEN 1 END) as total_redemptions,
        COUNT(CASE WHEN event_type = 'abandon' THEN 1 END) as total_abandons,
        COALESCE(SUM(CASE WHEN event_type = 'redeem' THEN revenue ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN event_type = 'redeem' THEN discount_amount ELSE 0 END), 0) as total_discount_given,
        COALESCE(AVG(CASE WHEN event_type = 'redeem' THEN cart_value END), 0) as avg_order_value,
        COUNT(DISTINCT CASE WHEN event_type = 'redeem' THEN customer_id END) as unique_customers
      FROM promo_code_analytics
      WHERE promo_code_id = ?
    `;

    const result = await query(analyticsQuery, [promoCodeId]);
    const stats = result.rows?.[0] || result[0];

    const totalViews = parseInt(stats.total_views) || 0;
    const totalValidations = parseInt(stats.total_validations) || 0;
    const successfulValidations = parseInt(stats.successful_validations) || 0;
    const failedValidations = parseInt(stats.failed_validations) || 0;
    const totalApplications = parseInt(stats.total_applications) || 0;
    const totalRedemptions = parseInt(stats.total_redemptions) || 0;
    const totalAbandons = parseInt(stats.total_abandons) || 0;
    const totalRevenue = parseFloat(stats.total_revenue) || 0;
    const totalDiscountGiven = parseFloat(stats.total_discount_given) || 0;
    const avgOrderValue = parseFloat(stats.avg_order_value) || 0;
    const uniqueCustomers = parseInt(stats.unique_customers) || 0;

    // Calculate rates
    const conversionRate = totalViews > 0 ? (totalRedemptions / totalViews) * 100 : 0;
    const validationSuccessRate = totalValidations > 0 ? (successfulValidations / totalValidations) * 100 : 0;
    const redemptionRate = totalApplications > 0 ? (totalRedemptions / totalApplications) * 100 : 0;

    // Insert or update cache (SQLite compatible - check first, then insert or update)
    const cacheCheck = await query(
      'SELECT promo_code_id FROM promo_code_performance_cache WHERE promo_code_id = ?',
      [promoCodeId]
    );

    if (cacheCheck.rows?.length > 0 || cacheCheck.length > 0) {
      // Update existing cache
      await query(`
        UPDATE promo_code_performance_cache SET
          total_views = ?,
          total_validations = ?,
          successful_validations = ?,
          failed_validations = ?,
          total_applications = ?,
          total_redemptions = ?,
          total_abandons = ?,
          total_revenue = ?,
          total_discount_given = ?,
          avg_order_value = ?,
          unique_customers = ?,
          conversion_rate = ?,
          validation_success_rate = ?,
          redemption_rate = ?,
          last_updated = datetime('now')
        WHERE promo_code_id = ?
      `, [
        totalViews, totalValidations, successfulValidations, failedValidations,
        totalApplications, totalRedemptions, totalAbandons,
        totalRevenue, totalDiscountGiven, avgOrderValue, uniqueCustomers,
        conversionRate, validationSuccessRate, redemptionRate, promoCodeId
      ]);
    } else {
      // Insert new cache
      await query(`
        INSERT INTO promo_code_performance_cache (
          promo_code_id, total_views, total_validations, successful_validations,
          failed_validations, total_applications, total_redemptions, total_abandons,
          total_revenue, total_discount_given, avg_order_value, unique_customers,
          conversion_rate, validation_success_rate, redemption_rate, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        promoCodeId, totalViews, totalValidations, successfulValidations, failedValidations,
        totalApplications, totalRedemptions, totalAbandons,
        totalRevenue, totalDiscountGiven, avgOrderValue, uniqueCustomers,
        conversionRate, validationSuccessRate, redemptionRate
      ]);
    }
  } catch (error) {
    console.error('Error updating promo code performance cache:', error);
    throw error;
  }
}

async function backfillAnalytics() {
  try {
    console.log('🔄 Starting promo code analytics backfill...\n');

    // Step 1: Check if analytics tables exist
    try {
      await query('SELECT 1 FROM promo_code_analytics LIMIT 1');
      await query('SELECT 1 FROM promo_code_performance_cache LIMIT 1');
      console.log('✅ Analytics tables exist\n');
    } catch (error) {
      console.error('❌ Analytics tables do not exist!');
      console.error('   Please run migration: 054_create_promo_code_analytics.sql\n');
      process.exit(1);
    }

    // Step 2: Get all orders with promo codes
    console.log('📊 Fetching historical orders with promo codes...');
    const ordersResult = await query(`
      SELECT 
        o.id as order_id,
        o.customer_id,
        o.promo_code,
        o.promo_discount,
        o.subtotal,
        o.total_amount as revenue,
        o.created_at as order_date
      FROM orders o
      WHERE o.promo_code IS NOT NULL 
        AND o.promo_code != ''
        AND o.promo_discount > 0
      ORDER BY o.created_at ASC
    `);

    const orders = ordersResult.rows || ordersResult;
    console.log(`   Found ${orders.length} orders with promo codes\n`);

    if (orders.length === 0) {
      console.log('ℹ️  No historical orders with promo codes found.');
      console.log('   Analytics will populate as new orders are created.\n');
      process.exit(0);
    }

    // Step 3: Check which orders are already backfilled
    console.log('🔍 Checking for existing analytics records...');
    const existingRecords = await query(`
      SELECT DISTINCT order_id 
      FROM promo_code_analytics 
      WHERE order_id IS NOT NULL AND event_type = 'redeem'
    `);
    const existingOrderIds = new Set(
      (existingRecords.rows || existingRecords).map(r => r.order_id)
    );
    console.log(`   Found ${existingOrderIds.size} already processed orders\n`);

    // Step 4: Process each order
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    const processedPromoCodes = new Set();

    console.log('📝 Processing orders...\n');

    for (const order of orders) {
      try {
        // Skip if already processed
        if (existingOrderIds.has(order.order_id)) {
          skipped++;
          continue;
        }

        // Find promo code ID
        const promoResult = await query(
          'SELECT id FROM promo_codes WHERE code = ?',
          [order.promo_code.toUpperCase()]
        );

        const promo = promoResult.rows?.[0] || promoResult[0];
        if (!promo) {
          console.log(`⚠️  Order #${order.order_id}: Promo code "${order.promo_code}" not found, skipping`);
          errors++;
          continue;
        }

        const promoCodeId = promo.id;

        // Create redeem event
        await query(`
          INSERT INTO promo_code_analytics (
            promo_code_id, event_type, customer_id, order_id, cart_value,
            discount_amount, revenue, created_at
          ) VALUES (?, 'redeem', ?, ?, ?, ?, ?, ?)
        `, [
          promoCodeId,
          order.customer_id || null,
          order.order_id,
          parseFloat(order.subtotal) || 0,
          parseFloat(order.promo_discount) || 0,
          parseFloat(order.revenue) || 0,
          order.order_date || new Date().toISOString()
        ]);

        // Track for cache update
        processedPromoCodes.add(promoCodeId);
        processed++;

        if (processed % 50 === 0) {
          console.log(`   Processed ${processed} orders...`);
        }
      } catch (error) {
        console.error(`❌ Error processing order #${order.order_id}:`, error.message);
        errors++;
      }
    }

    console.log(`\n✅ Processing complete!`);
    console.log(`   Processed: ${processed} orders`);
    console.log(`   Skipped (already exists): ${skipped} orders`);
    console.log(`   Errors: ${errors} orders\n`);

    // Step 5: Update performance cache for all affected promo codes
    console.log('🔄 Updating performance cache...');
    let cacheUpdated = 0;
    for (const promoCodeId of processedPromoCodes) {
      try {
        await updatePromoCodePerformanceCache(promoCodeId);
        cacheUpdated++;
      } catch (error) {
        console.error(`   Error updating cache for promo code ${promoCodeId}:`, error.message);
      }
    }
    console.log(`   Updated cache for ${cacheUpdated} promo codes\n`);

    // Step 6: Update used_count in promo_codes table
    console.log('🔄 Updating promo code usage counts...');
    const updateUsageCounts = await query(`
      UPDATE promo_codes
      SET used_count = (
        SELECT COUNT(*)
        FROM promo_code_analytics
        WHERE promo_code_analytics.promo_code_id = promo_codes.id
          AND promo_code_analytics.event_type = 'redeem'
      )
    `);
    console.log(`   Updated usage counts for all promo codes\n`);

    // Step 7: Summary statistics
    console.log('📈 Final Statistics:');
    const stats = await query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT promo_code_id) as unique_codes,
        COUNT(DISTINCT customer_id) as unique_customers,
        COUNT(DISTINCT order_id) as total_redemptions,
        SUM(discount_amount) as total_discount,
        SUM(revenue) as total_revenue
      FROM promo_code_analytics
      WHERE event_type = 'redeem'
    `);
    const statsData = stats.rows?.[0] || stats[0];
    console.log(`   Total redeem events: ${statsData.total_events || 0}`);
    console.log(`   Unique promo codes: ${statsData.unique_codes || 0}`);
    console.log(`   Unique customers: ${statsData.unique_customers || 0}`);
    console.log(`   Total redemptions: ${statsData.total_redemptions || 0}`);
    console.log(`   Total discount given: ₹${parseFloat(statsData.total_discount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
    console.log(`   Total revenue: ₹${parseFloat(statsData.total_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
    console.log('\n✅ Backfill completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Fatal error during backfill:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the backfill
backfillAnalytics()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
