const { query } = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function runReferralMigration() {
  try {
    console.log('Starting referral system migration...');

    // Check if referral_code column exists
    try {
      await query('SELECT referral_code FROM customers LIMIT 1');
      console.log('✓ referral_code column already exists');
    } catch (error) {
      console.log('Adding referral_code column...');
      try {
        // SQLite doesn't support UNIQUE in ALTER TABLE, so add without it
        await query('ALTER TABLE customers ADD COLUMN referral_code VARCHAR(20)');
        console.log('✓ referral_code column added');
        // Create unique index separately
        try {
          await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_referral_code_unique ON customers(referral_code) WHERE referral_code IS NOT NULL');
          console.log('✓ Unique index on referral_code created');
        } catch (indexError) {
          console.log('Note: Could not create unique index (may already exist)');
        }
      } catch (alterError) {
        console.log('Note: referral_code column might already exist');
        console.error('Error:', alterError.message);
      }
    }

    // Check if referred_by column exists
    try {
      await query('SELECT referred_by FROM customers LIMIT 1');
      console.log('✓ referred_by column already exists');
    } catch (error) {
      console.log('Adding referred_by column...');
      await query('ALTER TABLE customers ADD COLUMN referred_by INTEGER');
      console.log('✓ referred_by column added');
    }

    // Create referrals table
    console.log('Creating referrals table...');
    await query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referrer_id INTEGER NOT NULL,
        referee_id INTEGER NOT NULL,
        referral_code VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'credited', 'expired', 'cancelled')),
        referrer_bonus_amount DECIMAL(10,2) DEFAULT 0.00,
        referee_bonus_amount DECIMAL(10,2) DEFAULT 0.00,
        referrer_bonus_credited BOOLEAN DEFAULT 0,
        referee_bonus_credited BOOLEAN DEFAULT 0,
        referrer_bonus_credited_at DATETIME,
        referee_bonus_credited_at DATETIME,
        first_order_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (referrer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (referee_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (first_order_id) REFERENCES orders(id) ON DELETE SET NULL,
        UNIQUE(referee_id)
      )
    `);
    console.log('✓ referrals table created');

    // Create indexes
    console.log('Creating indexes...');
    try {
      await query('CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id)');
      await query('CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id)');
      await query('CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code)');
      await query('CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status)');
      await query('CREATE INDEX IF NOT EXISTS idx_customers_referral_code ON customers(referral_code)');
      await query('CREATE INDEX IF NOT EXISTS idx_customers_referred_by ON customers(referred_by)');
      console.log('✓ Indexes created');
    } catch (indexError) {
      console.log('Note: Some indexes might already exist');
    }

    // Generate referral codes for existing customers who don't have one
    console.log('Generating referral codes for existing customers...');
    const customersWithoutCode = await query(
      'SELECT id FROM customers WHERE referral_code IS NULL OR referral_code = ""'
    );

    if (customersWithoutCode.rows.length > 0) {
      console.log(`Found ${customersWithoutCode.rows.length} customers without referral codes`);
      
      const crypto = require('crypto');
      let codesGenerated = 0;

      for (const customer of customersWithoutCode.rows) {
        try {
          // Generate unique code
          let code;
          let isUnique = false;
          let attempts = 0;

          while (!isUnique && attempts < 10) {
            const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase().substring(0, 4);
            const idPart = String(customer.id).padStart(4, '0').slice(-4);
            code = randomPart + idPart;

            const existing = await query(
              'SELECT id FROM customers WHERE referral_code = ?',
              [code]
            );

            if (existing.rows.length === 0) {
              isUnique = true;
            }
            attempts++;
          }

          if (!isUnique) {
            code = 'REF' + String(customer.id).padStart(6, '0');
          }

          await query(
            'UPDATE customers SET referral_code = ? WHERE id = ?',
            [code, customer.id]
          );
          codesGenerated++;
        } catch (error) {
          console.error(`Error generating code for customer ${customer.id}:`, error.message);
        }
      }

      console.log(`✓ Generated ${codesGenerated} referral codes`);
    } else {
      console.log('✓ All customers already have referral codes');
    }

    console.log('\n✅ Referral system migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run migration
runReferralMigration()
  .then(() => {
    console.log('\nMigration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

