import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getActivePolls,
  getPollDetails,
  castVote,
  getPollResults
} from '../controllers/votingController';

const router = Router();

// All voting routes require authentication
router.use(authenticateToken);

// Get all active polls
router.get('/polls/active', getActivePolls);

// Get specific poll details
router.get('/polls/:pollId', getPollDetails);

// Cast a vote
router.post('/vote', castVote);

// Get poll results
router.get('/polls/:pollId/results', getPollResults);

export default router;
