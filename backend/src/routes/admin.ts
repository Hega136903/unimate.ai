import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import Vote from '../models/Vote';
import Poll from '../models/Poll';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { cleanupInvalidVotes } from '../controllers/votingController';

const router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Middleware to check admin role
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: any): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
    return;
  }
  next();
};

// GET /api/admin/stats - Get admin dashboard statistics
router.get('/stats', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [totalPolls, activePolls, totalVotes, totalUsers] = await Promise.all([
      Poll.countDocuments(),
      Poll.countDocuments({ isActive: true }),
      Vote.countDocuments(),
      User.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        totalPolls,
        activePolls,
        totalVotes,
        totalUsers
      }
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/polls - Get all polls with details
router.get('/polls', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Admin requesting all polls...');
    
    const polls = await Poll.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName email');

    console.log('📋 Found polls from database:', polls.length);
    console.log('📋 Poll details:', polls.map(p => ({
      id: p._id,
      title: p.title,
      options: p.options.length,
      optionDetails: p.options
    })));

    // Get vote counts for each poll
    const pollsWithVotes = await Promise.all(
      polls.map(async (poll: any) => {
        try {
          // Get votes from database for accurate count
          const votes = await Vote.find({ pollId: poll._id });
          const totalVotes = votes.length;
          
          console.log(`📋 Poll "${poll.title}" has ${totalVotes} votes from database`);
          
          // Calculate vote counts for each option from actual votes
          const optionVotes = poll.options.map((option: any) => {
            const optionVoteCount = votes.filter((vote: any) => vote.optionId === option.id).length;
            console.log(`📋 Option "${option.text}" (id: ${option.id}) has ${optionVoteCount} votes`);
            
            return {
              id: option.id,
              text: option.text,
              description: option.description || '',
              voteCount: optionVoteCount,
              percentage: totalVotes > 0 ? Math.round((optionVoteCount / totalVotes) * 100) : 0
            };
          });

          // Update the poll document with correct vote counts
          if (totalVotes !== poll.totalVotes) {
            console.log(`📋 Updating poll totalVotes from ${poll.totalVotes} to ${totalVotes}`);
            await Poll.findByIdAndUpdate(poll._id, { 
              totalVotes: totalVotes,
              options: optionVotes.map((ov: any) => ({
                id: ov.id,
                text: ov.text,
                description: ov.description,
                voteCount: ov.voteCount
              }))
            });
          }

          const pollWithVotes = {
            ...poll.toObject(),
            totalVotes,
            options: optionVotes
          };
          
          console.log(`📋 Final poll data for "${poll.title}":`, {
            id: pollWithVotes._id,
            title: pollWithVotes.title,
            totalVotes: pollWithVotes.totalVotes,
            options: pollWithVotes.options.map((o: any) => ({
              id: o.id,
              text: o.text,
              voteCount: o.voteCount
            }))
          });

          return pollWithVotes;
        } catch (error) {
          console.error(`📋 Error processing poll ${poll.title}:`, error);
          // Return poll with zero votes if error occurs
          return {
            ...poll.toObject(),
            totalVotes: 0,
            options: poll.options.map((option: any) => ({
              ...option.toObject(),
              voteCount: 0,
              percentage: 0
            }))
          };
        }
      })
    );

    console.log('📋 Sending polls to admin panel:', pollsWithVotes.length);

    res.json({
      success: true,
      data: pollsWithVotes
    });
  } catch (error) {
    console.error('📋 Error fetching admin polls:', error);
    logger.error('Error fetching polls:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/admin/polls - Create new poll
router.post('/polls', [
  authenticateToken,
  requireAdmin,
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('options').isArray({ min: 2 }).withMessage('At least 2 options are required'),
  body('options.*.text').trim().isLength({ min: 1 }).withMessage('Option text is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  body('category').isIn(['student-election', 'campus-decision', 'feedback']).withMessage('Valid category is required')
], async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { title, description, options, startTime, endTime, category, isAnonymous = true } = req.body;

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < now) {
      res.status(400).json({
        success: false,
        message: 'Start time cannot be in the past'
      });
      return;
    }

    if (end <= start) {
      res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
      return;
    }

    // Create poll options with unique IDs and zero vote counts
    const pollOptions = options.map((option: any, index: number) => ({
      id: `option_${Date.now()}_${index}`,
      text: option.text.trim(),
      description: option.description?.trim() || '',
      voteCount: 0
    }));

    const poll = new Poll({
      title: title.trim(),
      description: description.trim(),
      options: pollOptions,
      startTime: start,
      endTime: end,
      isActive: start <= now && end > now,
      isAnonymous,
      category,
      createdBy: req.user.id,
      totalVotes: 0,
      createdAt: new Date()
    });

    await poll.save();

    logger.info(`Admin ${req.user.email} created poll: ${title}`);

    res.status(201).json({
      success: true,
      message: 'Poll created successfully',
      data: poll
    });
  } catch (error) {
    logger.error('Error creating poll:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PATCH /api/admin/polls/:pollId/toggle - Toggle poll active status
router.patch('/polls/:pollId/toggle', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { pollId } = req.params;
    const { isActive } = req.body;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
      return;
    }

    // Check if poll time constraints allow activation
    const now = new Date();
    console.log('🔍 Poll activation check:', {
      pollId,
      isActive,
      pollTitle: poll.title,
      startTime: poll.startTime,
      endTime: poll.endTime,
      currentTime: now,
      startTimeInFuture: poll.startTime > now,
      endTimeInPast: poll.endTime <= now
    });

    // Only prevent activation if the poll has already ended
    if (isActive && poll.endTime <= now) {
      console.log('❌ Cannot activate poll - poll has already ended');
      res.status(400).json({
        success: false,
        message: `Cannot activate poll that has already ended. End time: ${poll.endTime}, Current time: ${now}`
      });
      return;
    }

    // Allow activating future polls, but warn about it
    if (isActive && poll.startTime > now) {
      console.log('⚠️ Activating future poll - will become available to students at start time');
    }

    poll.isActive = isActive;
    await poll.save();

    logger.info(`Admin ${req.user?.email} ${isActive ? 'activated' : 'deactivated'} poll: ${poll.title}`);

    res.json({
      success: true,
      message: `Poll ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: poll
    });
  } catch (error) {
    logger.error('Error toggling poll status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/admin/polls/:pollId - Delete poll
router.delete('/polls/:pollId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
      return;
    }

    // Delete all votes for this poll
    await Vote.deleteMany({ pollId });

    // Delete the poll
    await Poll.findByIdAndDelete(pollId);

    logger.info(`Admin ${req.user?.email} deleted poll: ${poll.title}`);

    res.json({
      success: true,
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting poll:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/polls/:pollId/analytics - Get detailed poll analytics
router.get('/polls/:pollId/analytics', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
      return;
    }

    const votes = await Vote.find({ pollId }).populate('userId', 'firstName lastName email department year');
    
    // Analytics data
    const analytics = {
      totalVotes: votes.length,
      votesByOption: poll.options.map((option: any) => ({
        option: option.text,
        votes: votes.filter((vote: any) => vote.optionId === option.id).length,
        percentage: votes.length > 0 ? Math.round((votes.filter((vote: any) => vote.optionId === option.id).length / votes.length) * 100) : 0
      })),
      votesByDepartment: {} as { [key: string]: number },
      votesByYear: {} as { [key: string]: number },
      votingTimeline: votes.map((vote: any) => ({
        timestamp: vote.createdAt,
        option: poll.options.find((opt: any) => opt.id === vote.optionId)?.text
      })).sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime())
    };

    // Department and year analysis (if not anonymous)
    if (!poll.isAnonymous) {
      votes.forEach((vote: any) => {
        if (vote.userId) {
          const user = vote.userId as any;
          if (user.department) {
            analytics.votesByDepartment[user.department] = (analytics.votesByDepartment[user.department] || 0) + 1;
          }
          if (user.year) {
            analytics.votesByYear[user.year] = (analytics.votesByYear[user.year] || 0) + 1;
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        poll: poll.toObject(),
        analytics
      }
    });
  } catch (error) {
    logger.error('Error fetching poll analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/users - Get user management data
router.get('/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    
    const query: any = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/admin/cleanup - Clean up invalid votes
router.post('/cleanup', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🧹 Admin cleanup request received');
    const deletedCount = await cleanupInvalidVotes();
    
    res.json({
      success: true,
      message: `Cleanup completed. Removed ${deletedCount} invalid votes.`,
      data: { deletedCount }
    });
  } catch (error) {
    logger.error('Error during cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during cleanup'
    });
  }
});

export default router;
