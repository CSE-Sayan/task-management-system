const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getProfile, updateProfile, changePassword, getAllUsers, updateUserRole, deleteUser
} = require('../controllers/userController');

router.use(authenticate);

// Self-management
router.get('/profile', getProfile);
router.put('/profile', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
], updateProfile);
router.put('/change-password', changePassword);

// Admin routes
router.get('/', authorize('admin'), getAllUsers);
router.put('/:id/role', authorize('admin'), updateUserRole);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
