const { query } = require('../src/config/db');
const { convertToIST, getCurrentIST } = require('../src/utils/timezone');

async function checkWalletDates() {
  try {
    console.log('Checking wallet transaction dates...\n');
    
    // Get recent transactions
    const result = await query(
      'SELECT id, customer_id, amount, description, created_at FROM wallet_transactions ORDER BY id DESC LIMIT 5'
    );
    
    console.log('Current IST time:', getCurrentIST());
    console.log('Current UTC time:', new Date().toISOString());
    console.log('\nTransactions in database:');
    console.log('='.repeat(80));
    
    result.rows.forEach(tx => {
      console.log(`\nTransaction ID: ${tx.id}`);
      console.log(`  Description: ${tx.description}`);
      console.log(`  Amount: ₹${tx.amount}`);
      console.log(`  Stored date (raw): ${tx.created_at}`);
      
      // Convert to IST ISO
      const istISO = convertToIST(tx.created_at);
      console.log(`  Converted to IST ISO: ${istISO}`);
      
      // Parse and show what it would display as
      if (istISO) {
        const date = new Date(istISO);
        const display = date.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        console.log(`  Display format (IST): ${display}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkWalletDates();

