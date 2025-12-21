const express = require('express');
const router = express.Router();
const comboController = require('../controllers/comboController');
const { customerAuthMiddleware } = require('../middleware/customerAuth');

// All combo routes require customer authentication (customer must be logged in)
router.use(customerAuthMiddleware);

// Combo selection routes
router.route('/cart-item/:cartItemId')
  .get(comboController.getComboSelections)
  .delete(comboController.clearComboSelections);

router.route('/cart-item/:cartItemId/summary')
  .get(comboController.getComboSummary);

router.route('/add')
  .post(comboController.addToCombo);

router.route('/:selectionId')
  .put(comboController.updateComboQuantity)
  .delete(comboController.removeFromCombo);

// Analytics routes
router.route('/analytics')
  .get(comboController.getComboAnalytics);

// Order combo selections route
router.route('/order/:orderId')
  .get(comboController.getOrderComboSelections);

module.exports = router;
