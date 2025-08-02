import express from 'express';
import { 
  sendDeadlineAlerts, 
  testEmailService, 
  getNotificationHistory,
  updateNotificationPreferences,
  triggerAutomaticEmailCheck
} from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   POST /api/notifications/deadline-alerts
// @desc    Send deadline alert emails
// @access  Private
router.post('/deadline-alerts', sendDeadlineAlerts);

// @route   POST /api/notifications/test-email
// @desc    Test email service configuration
// @access  Private
router.post('/test-email', testEmailService);

// @route   GET /api/notifications/history
// @desc    Get notification history for user
// @access  Private
router.get('/history', getNotificationHistory);

// @route   PUT /api/notifications/preferences
// @desc    Update notification preferences
// @access  Private
router.put('/preferences', updateNotificationPreferences);

// @route   POST /api/notifications/trigger-automatic-check
// @desc    Manually trigger automatic email check for all users
// @access  Private
router.post('/trigger-automatic-check', triggerAutomaticEmailCheck);

export default router;
