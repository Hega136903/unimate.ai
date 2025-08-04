import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getStudentSchedule,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  getUpcomingDeadlines,
  getAISuggestions,
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

// Get upcoming deadlines
router.get('/deadlines', getUpcomingDeadlines);

// Get AI suggestions
router.get('/suggestions', getAISuggestions);

// Get schedule analytics
router.get('/analytics', getScheduleAnalytics);

export default router;
