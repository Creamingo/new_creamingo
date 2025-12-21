// Helper function to create notifications for wallet transactions
const notificationService = require('../services/notificationService');

const createWalletNotification = async (customerId, transactionType, amount, description, orderId = null) => {
  try {
    let type = 'wallet_credit';
    let title = '';
    let message = '';

    switch (transactionType) {
      case 'welcome_bonus':
        type = 'wallet_credit';
        title = 'Welcome Bonus Credited! 🎉';
        message = `₹${amount.toFixed(2)} welcome bonus has been added to your wallet.`;
        break;
      case 'order_cashback':
        type = 'wallet_credit';
        title = 'Cashback Earned! 💰';
        message = `You earned ₹${amount.toFixed(2)} cashback from your order.`;
        break;
      case 'referral_bonus':
        type = 'referral_bonus';
        title = 'Referral Bonus Credited! 🎁';
        message = `₹${amount.toFixed(2)} referral bonus has been added to your wallet.`;
        break;
      case 'order_redemption':
        type = 'wallet_debit';
        title = 'Wallet Used for Order 💸';
        message = `₹${amount.toFixed(2)} was used from your wallet for order.`;
        break;
      case 'order_refund':
        type = 'wallet_credit';
        title = 'Refund Credited! 💰';
        message = `₹${amount.toFixed(2)} refund has been added to your wallet.`;
        break;
      default:
        type = 'wallet_credit';
        title = 'Wallet Updated';
        message = description || `₹${amount.toFixed(2)} has been ${amount >= 0 ? 'added to' : 'deducted from'} your wallet.`;
    }

    const data = {
      amount,
      transactionType,
      orderId,
      description
    };

    await notificationService.createNotification(
      customerId,
      type,
      title,
      message,
      data
    );
  } catch (error) {
    console.error('Create wallet notification error:', error);
    // Don't fail transaction if notification fails
  }
};

const createMilestoneNotification = async (customerId, milestoneName, bonusAmount) => {
  try {
    await notificationService.createNotification(
      customerId,
      'milestone',
      `Milestone Achieved: ${milestoneName}! 🏆`,
      `Congratulations! You've earned ₹${bonusAmount.toFixed(2)} bonus for reaching ${milestoneName} milestone.`,
      { milestoneName, bonusAmount }
    );
  } catch (error) {
    console.error('Create milestone notification error:', error);
  }
};

const createScratchCardNotification = async (customerId, amount, orderNumber) => {
  try {
    await notificationService.createNotification(
      customerId,
      'scratch_card',
      'Scratch Card Revealed! 🎫',
      `You won ₹${amount.toFixed(2)} cashback! It will be credited after order delivery.`,
      { amount, orderNumber }
    );
  } catch (error) {
    console.error('Create scratch card notification error:', error);
  }
};

module.exports = {
  createWalletNotification,
  createMilestoneNotification,
  createScratchCardNotification
};

