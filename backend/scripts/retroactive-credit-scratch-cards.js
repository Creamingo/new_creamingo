const { query, db } = require('../src/config/db');
const { autoCreditScratchCardsForOrder } = require('../src/controllers/scratchCardController');

async function retroactiveCreditScratchCards() {
  try {
    console.log('Starting retroactive scratch card processing for delivered orders...');
    console.log('This will auto-reveal pending cards and credit all eligible cards.\n');

    // Get all delivered orders
    const deliveredOrders = await query(
      'SELECT id, order_number, customer_id, status FROM orders WHERE status = ?',
      ['delivered']
    );

    if (deliveredOrders.rows.length === 0) {
      console.log('No delivered orders found.');
      process.exit(0);
    }

    console.log(`Found ${deliveredOrders.rows.length} delivered order(s).\n`);

    let totalCredited = 0;
    let totalRevealed = 0;
    let totalCards = 0;
    const errors = [];

    for (const order of deliveredOrders.rows) {
      console.log(`Processing order ${order.order_number} (ID: ${order.id})...`);
      
      try {
        const result = await autoCreditScratchCardsForOrder(order.id);
        
        if (result.success) {
          if (result.credited > 0) {
            const revealedMsg = result.revealed > 0 ? ` (${result.revealed} auto-revealed)` : '';
            console.log(`  ✓ Processed ${result.credited} scratch card(s)${revealedMsg}`);
            totalCredited += result.credited;
            totalRevealed += result.revealed || 0;
            totalCards += result.total;
          } else {
            console.log(`  - No scratch cards to process`);
          }
          
          if (result.errors && result.errors.length > 0) {
            console.log(`  ⚠ ${result.errors.length} error(s) occurred`);
            errors.push({ orderId: order.id, orderNumber: order.order_number, errors: result.errors });
          }
        } else {
          console.log(`  ✗ Failed: ${result.error}`);
          errors.push({ orderId: order.id, orderNumber: order.order_number, error: result.error });
        }
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        errors.push({ orderId: order.id, orderNumber: order.order_number, error: error.message });
      }
      
      console.log('');
    }

    console.log('================================================================================');
    console.log('Summary:');
    console.log(`  Total delivered orders processed: ${deliveredOrders.rows.length}`);
    console.log(`  Scratch cards auto-revealed: ${totalRevealed}`);
    console.log(`  Scratch cards credited: ${totalCredited}`);
    console.log(`  Total scratch cards found: ${totalCards}`);
    console.log(`  Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(err => {
        console.log(`  - Order ${err.orderNumber || err.orderId}: ${err.error || JSON.stringify(err.errors)}`);
      });
    }
    
    console.log('\n✅ Retroactive crediting completed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Retroactive crediting failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

retroactiveCreditScratchCards();

