import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { getDashboardAnalytics, getUsageAnalytics, getAdminAnalytics } from '../controllers/analyticsController';

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', authenticateToken, getDashboardAnalytics);

// @route   GET /api/analytics/usage
// @desc    Get user usage statistics
// @access  Private
router.get('/usage', authenticateToken, getUsageAnalytics);

// @route   GET /api/analytics/admin
// @desc    Get admin analytics
// @access  Private/Admin
router.get('/admin', authenticateToken, authorizeRoles('admin'), getAdminAnalytics);

export default router;
