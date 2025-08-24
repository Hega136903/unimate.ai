import express from 'express';
import { body, query } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import {
  askAI,
  getAIRecommendations,
  createStudySession,
  summarizeContent,
  chatWithAI,
  getChatHistory,
  clearChatHistory
} from '../controllers/aiController';

const router = express.Router();

// AI Chat endpoint (authenticated)
router.post('/chat', authenticateToken, [
  body('message').trim().notEmpty().withMessage('Message is required')
], chatWithAI);

// Chat history endpoints (authenticated)
router.get('/chat/history', authenticateToken, [
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be 1-200'),
  query('before').optional().isISO8601().withMessage('before must be a valid ISO date')
], getChatHistory);

router.delete('/chat/history', authenticateToken, clearChatHistory);

// AI Q&A endpoint
router.post('/ask', authenticateToken, [
  body('question').trim().notEmpty().withMessage('Question is required')
], askAI);

// AI Study Session endpoint
router.post('/study-session', authenticateToken, [
  body('topic').trim().notEmpty().withMessage('Topic is required')
], createStudySession);

// AI Content Summarization endpoint
router.post('/summarize', authenticateToken, [
  body('content').trim().notEmpty().withMessage('Content is required')
], summarizeContent);

// AI Recommendations endpoint (requires authentication)
router.post('/recommendations', authenticateToken, getAIRecommendations);

export default router;
