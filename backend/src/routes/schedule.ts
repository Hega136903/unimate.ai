import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getStudentSchedule,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  getSmartSuggestions,
  createStudySession,
  getScheduleAnalytics
} from '../controllers/scheduleController';

const router = Router();

// All schedule routes require authentication
router.use(authenticateToken);

// Get student schedule
router.get('/', getStudentSchedule);

// Create schedule item
router.post('/items', createScheduleItem);

// Update schedule item
router.put('/items/:itemId', updateScheduleItem);

// Delete schedule item
router.delete('/items/:itemId', deleteScheduleItem);

// Get smart suggestions
router.get('/suggestions', getSmartSuggestions);

// Create AI-powered study session
router.post('/study-sessions', createStudySession);

// Get schedule analytics
router.get('/analytics', getScheduleAnalytics);

export default router;
