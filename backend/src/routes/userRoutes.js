const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  changePassword,
  updateUserOrder,
  getUserStats
} = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const { canManageUsers } = require('../middleware/role');
const { validate, schemas } = require('../middleware/validation');

// All routes require authentication and super admin role
router.use(authMiddleware);
router.use(canManageUsers);

// User management routes
router.get('/', getUsers);
router.get('/stats', getUserStats);
router.get('/:id', getUser);
router.post('/', validate(schemas.createUser), createUser);
router.put('/:id', validate(schemas.updateUser), updateUser);
router.patch('/:id/status', validate(schemas.toggleUserStatus), toggleUserStatus);
router.patch('/:id/password', validate(schemas.changePassword), changePassword);
router.patch('/update-order', updateUserOrder);
router.delete('/:id', deleteUser);

module.exports = router;
