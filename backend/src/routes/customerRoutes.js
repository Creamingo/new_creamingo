const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  getCustomerOrders,
  getCustomerWalletTransactions,
  getCustomerReferrals,
  getCustomerScratchCards,
  getCustomerTierInfo
} = require('../controllers/customerController');
const { authMiddleware } = require('../middleware/auth');
const { canManageCustomers } = require('../middleware/role');
const { validate, schemas } = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /api/customers - Get all customers with pagination and filters
router.get('/', canManageCustomers, getCustomers);

// GET /api/customers/stats - Get customer statistics
router.get('/stats', canManageCustomers, getCustomerStats);

// GET /api/customers/:id - Get single customer
router.get('/:id', canManageCustomers, getCustomer);

// GET /api/customers/:id/orders - Get customer orders
router.get('/:id/orders', canManageCustomers, getCustomerOrders);

// GET /api/customers/:id/wallet-transactions - Get customer wallet transactions
router.get('/:id/wallet-transactions', canManageCustomers, getCustomerWalletTransactions);

// GET /api/customers/:id/referrals - Get customer referrals
router.get('/:id/referrals', canManageCustomers, getCustomerReferrals);

// GET /api/customers/:id/scratch-cards - Get customer scratch cards
router.get('/:id/scratch-cards', canManageCustomers, getCustomerScratchCards);

// GET /api/customers/:id/tier-info - Get customer tier and milestone info
router.get('/:id/tier-info', canManageCustomers, getCustomerTierInfo);

// POST /api/customers - Create new customer
router.post('/', canManageCustomers, validate(schemas.createCustomer), createCustomer);

// PUT /api/customers/:id - Update customer
router.put('/:id', canManageCustomers, validate(schemas.updateCustomer), updateCustomer);

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', canManageCustomers, deleteCustomer);

module.exports = router;
