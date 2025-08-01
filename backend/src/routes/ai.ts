import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { askAI, getAIRecommendations, createStudySession } from '../controllers/aiController';

const router = express.Router();

// @route   POST /api/ai/ask
// @desc    Ask AI a question
// @access  Private
router.post(
  '/ask',
  authenticateToken,
  [
    body('question').trim().notEmpty().withMessage('Question is required'),
    body('context').optional().trim(),
  ],
  askAI
);

// @route   POST /api/ai/study-session
// @desc    Create AI-powered study session
// @access  Private
router.post(
  '/study-session',
  authenticateToken,
  [
    body('topic').trim().notEmpty().withMessage('Topic is required'),
    body('duration').optional().isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes'),
    body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
  ],
  createStudySession
);

// @route   GET /api/ai/recommendations
// @desc    Get AI recommendations for student
// @access  Private
router.get('/recommendations', authenticateToken, getAIRecommendations);

export default router;
