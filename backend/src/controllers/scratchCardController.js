const { query } = require('../config/db');
const { getCurrentIST, convertToIST } = require('../utils/timezone');

// Get available scratch cards for a customer
const getScratchCards = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { status } = req.query; // Optional filter: pending, revealed, credited

    let whereClause = 'WHERE customer_id = ?';
    const params = [customerId];

    if (status && ['pending', 'revealed', 'credited', 'expired'].includes(status)) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const result = await query(
      `SELECT 
        id,
        customer_id,
        order_id,
        amount,
        status,
        revealed_at,
        credited_at,
        created_at
      FROM scratch_cards 
      ${whereClause}
      ORDER BY created_at DESC`,
      params
    );

    // Get order numbers for each scratch card
    const scratchCards = await Promise.all(
      result.rows.map(async (card) => {
        let orderNumber = null;
        if (card.order_id) {
          const orderResult = await query(
            'SELECT order_number FROM orders WHERE id = ?',
            [card.order_id]
          );
          if (orderResult.rows.length > 0) {
            orderNumber = orderResult.rows[0].order_number;
          }
        }

        return {
          id: card.id,
          orderId: card.order_id,
          orderNumber: orderNumber,
          amount: Math.round(parseFloat(card.amount)), // Round to nearest whole number
          status: card.status,
          revealedAt: card.revealed_at ? convertToIST(card.revealed_at) : null,
          creditedAt: card.credited_at ? convertToIST(card.credited_at) : null,
          createdAt: convertToIST(card.created_at)
        };
      })
    );

    res.json({
      success: true,
      data: {
        scratchCards
      }
    });
  } catch (error) {
    console.error('Get scratch cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reveal scratch card (user scratches it)
const revealScratchCard = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { scratchCardId } = req.body;

    if (!scratchCardId) {
      return res.status(400).json({
        success: false,
        message: 'Scratch card ID is required'
      });
    }

    // Get scratch card
    const cardResult = await query(
      'SELECT id, customer_id, order_id, amount, status FROM scratch_cards WHERE id = ? AND customer_id = ?',
      [scratchCardId, customerId]
    );

    if (cardResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Scratch card not found'
      });
    }

    const card = cardResult.rows[0];

    if (card.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Scratch card already ${card.status}`
      });
    }

    // Check if order exists (no need to check delivery status for reveal - can reveal immediately)
    const orderResult = await query(
      'SELECT status, order_number FROM orders WHERE id = ?',
      [card.order_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const orderStatus = orderResult.rows[0].status;
    const orderNumber = orderResult.rows[0].order_number;

    // Allow revealing scratch card immediately (even before delivery)
    // But credit will only happen after delivery confirmation
    console.log(`Allowing scratch card reveal for order ${orderNumber} (ID: ${card.order_id}). Status: ${orderStatus}`);

    // Update scratch card status to revealed
    const updateResult = await query(
      `UPDATE scratch_cards 
      SET status = 'revealed', revealed_at = NOW(), updated_at = NOW()
      WHERE id = ?`,
      [scratchCardId]
    );

    res.json({
      success: true,
      message: 'Scratch card revealed successfully',
      data: {
        amount: Math.round(parseFloat(card.amount)), // Round to nearest whole number
        status: 'revealed',
        message: 'Cashback will be credited to your wallet after order delivery confirmation'
      }
    });
  } catch (error) {
    console.error('Reveal scratch card error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Auto-credit all scratch cards for a delivered order (internal function)
// This function will auto-reveal pending cards and then credit them
const autoCreditScratchCardsForOrder = async (orderId) => {
  try {
    // Check if scratch_cards table exists
    try {
      await query('SELECT 1 FROM scratch_cards LIMIT 1');
    } catch (tableError) {
      console.error('Scratch cards table does not exist. Skipping auto-credit.');
      return { success: false, error: 'Scratch cards table not found' };
    }

    // Get all pending or revealed (but not yet credited) scratch cards for this order
    const cardsResult = await query(
      'SELECT id, customer_id, amount, status FROM scratch_cards WHERE order_id = ? AND status IN (?, ?)',
      [orderId, 'pending', 'revealed']
    );

    if (cardsResult.rows.length === 0) {
      return { success: true, credited: 0, revealed: 0, message: 'No scratch cards to process' };
    }

    let creditedCount = 0;
    let revealedCount = 0;
    const errors = [];

    for (const card of cardsResult.rows) {
      try {
        const customerId = card.customer_id;
        const amount = Math.round(parseFloat(card.amount));
        const currentStatus = card.status;

        // Step 1: Auto-reveal if card is still pending
        if (currentStatus === 'pending') {
          await query(
            `UPDATE scratch_cards 
            SET status = 'revealed', revealed_at = NOW(), updated_at = NOW()
            WHERE id = ?`,
            [card.id]
          );
          revealedCount++;
          console.log(`Auto-revealed scratch card ${card.id} for order ${orderId}`);
        }

        // Step 2: Credit the card (whether it was just revealed or already revealed)
        // Get current wallet balance
        const currentBalance = await query(
          'SELECT COALESCE(wallet_balance, 0) as wallet_balance FROM customers WHERE id = ?',
          [customerId]
        );
        const balance = parseFloat(currentBalance.rows[0].wallet_balance) || 0;
        const newBalance = balance + amount;

        // Get order number for transaction description
        const orderNumResult = await query(
          'SELECT order_number FROM orders WHERE id = ?',
          [orderId]
        );
        const orderNum = orderNumResult.rows[0]?.order_number || `#${orderId}`;

        // Update scratch card status to credited
        await query(
          `UPDATE scratch_cards 
          SET status = 'credited', credited_at = NOW(), updated_at = NOW()
          WHERE id = ?`,
          [card.id]
        );

        // Create wallet transaction
        await query(
          `INSERT INTO wallet_transactions 
          (customer_id, type, amount, order_id, description, status, transaction_type, created_at, updated_at)
          VALUES (?, 'credit', ?, ?, ?, 'completed', 'order_cashback', NOW(), NOW())`,
          [customerId, amount, orderId, `Cashback (Order ${orderNum})`]
        );

        // Update customer balance
        await query(
          'UPDATE customers SET wallet_balance = ? WHERE id = ?',
          [newBalance, customerId]
        );

        // Create notification
        try {
          const { createWalletNotification } = require('../utils/notificationHelper');
          await createWalletNotification(customerId, 'order_cashback', amount, `Cashback (Order ${orderNum})`, orderId);
        } catch (notifError) {
          console.error('Notification creation error:', notifError);
        }

        creditedCount++;
        console.log(`Auto-credited scratch card ${card.id}: ₹${amount} to customer ${customerId} for order ${orderNum}`);
      } catch (error) {
        console.error(`Error processing scratch card ${card.id}:`, error);
        errors.push({ cardId: card.id, error: error.message });
      }
    }

    return {
      success: true,
      credited: creditedCount,
      revealed: revealedCount,
      total: cardsResult.rows.length,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('Auto-credit scratch cards error:', error);
    return { success: false, error: error.message };
  }
};

// Credit scratch card (called when order is confirmed delivered)
const creditScratchCard = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { scratchCardId } = req.body;

    if (!scratchCardId) {
      return res.status(400).json({
        success: false,
        message: 'Scratch card ID is required'
      });
    }

    // Get scratch card
    const cardResult = await query(
      'SELECT id, customer_id, order_id, amount, status FROM scratch_cards WHERE id = ? AND customer_id = ?',
      [scratchCardId, customerId]
    );

    if (cardResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Scratch card not found'
      });
    }

    const card = cardResult.rows[0];

    if (card.status === 'credited') {
      return res.status(400).json({
        success: false,
        message: 'Scratch card already credited'
      });
    }

    if (card.status !== 'revealed') {
      return res.status(400).json({
        success: false,
        message: 'Scratch card must be revealed before crediting'
      });
    }

    // Check if order is delivered (required for crediting)
    const orderResult = await query(
      'SELECT status, order_number FROM orders WHERE id = ?',
      [card.order_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const orderStatus = orderResult.rows[0].status;
    const orderNumber = orderResult.rows[0].order_number;

    // Only credit if order is delivered (not if cancelled or pending)
    if (orderStatus !== 'delivered') {
      if (orderStatus === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'Cannot credit cashback for cancelled orders'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Order must be delivered before crediting scratch card. Current status: ${orderStatus}`
      });
    }

    console.log(`Crediting scratch card for delivered order ${orderNumber} (ID: ${card.order_id})`);

    const amount = Math.round(parseFloat(card.amount)); // Round to nearest whole number
    const currentBalance = await query(
      'SELECT COALESCE(wallet_balance, 0) as wallet_balance FROM customers WHERE id = ?',
      [customerId]
    );
    const balance = parseFloat(currentBalance.rows[0].wallet_balance) || 0;
    const newBalance = balance + amount;

    // Update scratch card status and credit wallet
    await query(
      `UPDATE scratch_cards 
      SET status = 'credited', credited_at = NOW(), updated_at = NOW()
      WHERE id = ?`,
      [scratchCardId]
    );

    // Get order number for transaction description
    const orderNumResult = await query(
      'SELECT order_number FROM orders WHERE id = ?',
      [card.order_id]
    );
    const orderNum = orderNumResult.rows[0]?.order_number || `#${card.order_id}`;

    // Create wallet transaction
    await query(
      `INSERT INTO wallet_transactions 
      (customer_id, type, amount, order_id, description, status, transaction_type, created_at, updated_at)
      VALUES (?, 'credit', ?, ?, ?, 'completed', 'order_cashback', NOW(), NOW())`,
      [customerId, amount, card.order_id, `Cashback (Order ${orderNum})`]
    );

    // Update customer balance
    await query(
      'UPDATE customers SET wallet_balance = ? WHERE id = ?',
      [newBalance, customerId]
    );

    res.json({
      success: true,
      message: 'Cashback credited to wallet successfully',
      data: {
        amount: amount,
        newBalance: newBalance
      }
    });
  } catch (error) {
    console.error('Credit scratch card error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create scratch card when order is delivered (internal function, called from order controller)
const createScratchCardForOrder = async (orderId, customerId, orderTotal) => {
  try {
    // Check if scratch_cards table exists
    try {
      await query('SELECT 1 FROM scratch_cards LIMIT 1');
    } catch (tableError) {
      console.error('Scratch cards table does not exist. Please run the migration.');
      return { 
        success: false, 
        error: 'Scratch cards table not found. Run migration: node scripts/run-wallet-migration.js' 
      };
    }

    // Check if scratch card already exists for this order
    const existingResult = await query(
      'SELECT id FROM scratch_cards WHERE order_id = ?',
      [orderId]
    );

    if (existingResult.rows.length > 0) {
      console.log(`Scratch card already exists for order ${orderId}`);
      // Return existing scratch card info
      const existingCard = await query(
        'SELECT id, amount FROM scratch_cards WHERE order_id = ?',
        [orderId]
      );
      return { 
        success: true, 
        message: 'Scratch card already exists',
        scratchCardId: existingCard.rows[0].id,
        amount: Math.round(parseFloat(existingCard.rows[0].amount)) // Round to nearest whole number
      };
    }

    // Calculate cashback as 4% to 7% of order total
    const minPercentage = 0.04; // 4%
    const maxPercentage = 0.07; // 7%
    const randomPercentage = minPercentage + (Math.random() * (maxPercentage - minPercentage));
    const calculatedAmount = orderTotal * randomPercentage;
    
    // Round to nearest whole number (>= 0.5 rounds up, < 0.5 rounds down)
    const amount = Math.round(calculatedAmount);

    // Ensure minimum amount is at least ₹1
    const finalAmount = Math.max(1, amount);

    // Create scratch card with 'pending' status (can be revealed immediately, but only credited after delivery)
    const result = await query(
      `INSERT INTO scratch_cards 
      (customer_id, order_id, amount, status, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', NOW(), NOW())`,
      [customerId, orderId, finalAmount]
    );

    console.log(`Scratch card created for order ${orderId}: ₹${finalAmount} (${(randomPercentage * 100).toFixed(2)}% of ₹${orderTotal})`);

    return {
      success: true,
      scratchCardId: result.lastID,
      amount: finalAmount
    };
  } catch (error) {
    console.error('Create scratch card error:', error);
    console.error('Error stack:', error.stack);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getScratchCards,
  revealScratchCard,
  creditScratchCard,
  createScratchCardForOrder,
  autoCreditScratchCardsForOrder
};

