import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Get all users endpoint - coming soon',
  });
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Get user by ID endpoint - coming soon',
    userId: req.params.id,
  });
});

export default router;
