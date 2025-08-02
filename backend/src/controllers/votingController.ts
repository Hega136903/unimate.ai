import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import Poll, { IPoll } from '../models/Poll';
import Vote, { IVote } from '../models/Vote';

// Database cleanup function
export const cleanupInvalidVotes = async () => {
  try {
    console.log('🧹 Starting vote cleanup...');
    
    // Remove votes with null or undefined voterId
    const deleteResult = await Vote.deleteMany({
      $or: [
        { voterId: null },
        { voterId: undefined },
        { voterId: '' }
      ]
    });
    
    console.log(`🧹 Removed ${deleteResult.deletedCount} invalid votes`);
    
    return deleteResult.deletedCount;
  } catch (error) {
    console.error('🧹 Cleanup error:', error);
    return 0;
  }
};

// Interfaces for voting system
interface PollOption {
  id: string;
  text: string;
  description?: string;
  voteCount: number;
}

// Get all active polls
export const getActivePolls = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Fetch active polls from database
    const now = new Date();
    console.log('🔍 Fetching polls with criteria:', {
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
      currentTime: now
    });

    const activePolls = await Poll.find({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now }
    }).sort({ createdAt: -1 });

    console.log('🔍 Found polls:', activePolls.length);
    if (activePolls.length > 0) {
      console.log('🔍 Poll details:', activePolls.map(p => ({
        id: p._id,
        title: p.title,
        isActive: p.isActive,
        startTime: p.startTime,
        endTime: p.endTime
      })));
    }

    // Also check all polls in database for debugging
    const allPolls = await Poll.find({}).sort({ createdAt: -1 });
    console.log('🔍 All polls in database:', allPolls.length);
    if (allPolls.length > 0) {
      console.log('🔍 All poll details:', allPolls.map(p => ({
        id: p._id,
        title: p.title,
        isActive: p.isActive,
        startTime: p.startTime,
        endTime: p.endTime,
        isInPast: p.endTime < now,
        isInFuture: p.startTime > now
      })));
    }

    // Check which polls user has already voted in
    const pollsWithVoteStatus = await Promise.all(activePolls.map(async (poll) => {
      const userVote = await Vote.findOne({
        pollId: poll._id,
        voterId: userId
      });
      
      const userHasVoted = !!userVote;

      const canVote = poll.isActive && 
                     now >= poll.startTime && 
                     now <= poll.endTime && 
                     !userHasVoted;

      // Convert MongoDB document to plain object and add vote status
      const pollObj = poll.toObject();
      return {
        ...pollObj,
        id: (poll._id as any).toString(), // Ensure we have an id field
        userHasVoted,
        canVote,
        timeRemaining: poll.endTime.getTime() - now.getTime()
      };
    }));

    logger.info(`Active polls retrieved for user ${userId}: ${activePolls.length} polls`);

    return res.json({
      success: true,
      message: 'Active polls retrieved successfully',
      data: pollsWithVoteStatus
    });
  } catch (error) {
    logger.error('Get active polls error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve active polls'
    });
  }
};

// Get poll details
export const getPollDetails = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { pollId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    const userVote = await Vote.findOne({
      pollId: poll._id,
      voterId: userId
    });
    
    const userHasVoted = !!userVote;

    const now = new Date();
    const pollObj = poll.toObject();
    const pollWithStatus = {
      ...pollObj,
      id: (poll._id as any).toString(),
      userHasVoted,
      timeRemaining: poll.endTime.getTime() - now.getTime(),
      canVote: poll.isActive && now >= poll.startTime && now <= poll.endTime && !userHasVoted
    };

    logger.info(`Poll details retrieved for poll ${pollId} by user ${userId}`);

    return res.json({
      success: true,
      message: 'Poll details retrieved successfully',
      data: pollWithStatus
    });
  } catch (error) {
    logger.error('Get poll details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve poll details'
    });
  }
};

// Cast a vote
export const castVote = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { pollId, optionId } = req.body;

    console.log('🗳️ Cast vote request:', {
      userId,
      pollId,
      optionId,
      userObject: (req as any).user,
      authHeader: req.headers.authorization
    });

    if (!userId) {
      console.log('❌ No userId found in request.user:', (req as any).user);
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!pollId || !optionId) {
      return res.status(400).json({
        success: false,
        message: 'Poll ID and option ID are required'
      });
    }

    // Find the poll in database
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check if poll is active and within voting period
    const now = new Date();
    if (!poll.isActive || now < poll.startTime || now > poll.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Poll is not currently active for voting'
      });
    }

    // Check if user has already voted
    const existingVote = await Vote.findOne({
      pollId: pollId,
      voterId: userId
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this poll'
      });
    }

    // Check if option exists
    const option = poll.options.find(opt => opt.id === optionId);
    if (!option) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option selected'
      });
    }

    // Create new vote in database
    const newVote = new Vote({
      voterId: userId,
      pollId: pollId,
      optionId: optionId,
      timestamp: new Date(),
      isAnonymous: poll.isAnonymous
    });

    console.log('🗳️ Attempting to save vote:', {
      voterId: userId,
      pollId: pollId,
      optionId: optionId
    });

    try {
      await newVote.save();
      console.log('✅ Vote saved successfully');
    } catch (saveError: any) {
      console.error('❌ Vote save error:', saveError);
      
      // Handle duplicate vote error specifically
      if (saveError.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'You have already voted in this poll'
        });
      }
      
      // Re-throw other errors
      throw saveError;
    }

    // Update vote counts in the poll document
    await Poll.findByIdAndUpdate(
      pollId,
      {
        $inc: {
          [`options.$[elem].voteCount`]: 1,
          totalVotes: 1
        }
      },
      {
        arrayFilters: [{ 'elem.id': optionId }],
        new: true
      }
    );

    console.log(`✅ Vote cast successfully: Poll ${pollId}, Option ${optionId}, User ${userId}`);

    logger.info(`Vote cast successfully: Poll ${pollId}, Option ${optionId}, User ${userId}`);

    return res.json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        voteId: (newVote._id as any).toString(),
        pollTitle: poll.title,
        selectedOption: option.text,
        timestamp: newVote.timestamp
      }
    });
  } catch (error) {
    logger.error('Cast vote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cast vote'
    });
  }
};

// Get poll results
export const getPollResults = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { pollId } = req.params;

    console.log('📊 Getting poll results for pollId:', pollId, 'userId:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) {
      console.log('❌ Poll not found:', pollId);
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    console.log('📊 Found poll:', {
      id: poll._id,
      title: poll.title,
      optionsCount: poll.options.length,
      options: poll.options.map(o => ({ id: o.id, text: o.text }))
    });

    // Get all votes for this poll from the database
    const votes = await Vote.find({ pollId: poll._id });
    console.log('📊 Found votes:', votes.length, votes.map(v => ({ optionId: v.optionId, voterId: v.voterId })));

    // Calculate vote counts for each option
    const optionsWithVotes = poll.options.map((option: any) => {
      const optionVotes = votes.filter(vote => vote.optionId === option.id);
      const voteCount = optionVotes.length;
      
      console.log(`📊 Option "${option.text}" (${option.id}): ${voteCount} votes`);
      
      return {
        id: option.id,
        text: option.text,
        description: option.description || '',
        voteCount: voteCount
      };
    });

    // Calculate total votes
    const totalVotes = votes.length;
    console.log('📊 Total votes:', totalVotes);

    // Calculate percentages
    const resultsWithPercentages = optionsWithVotes.map(option => ({
      ...option,
      percentage: totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0
    }));

    const userVote = await Vote.findOne({
      pollId: poll._id,
      voterId: userId
    });

    console.log('📊 User vote:', userVote ? { optionId: userVote.optionId } : 'No vote found');

    const results = {
      poll: {
        id: (poll._id as any).toString(),
        title: poll.title,
        description: poll.description,
        totalVotes: totalVotes,
        endTime: poll.endTime,
        isActive: poll.isActive,
        hasEnded: new Date() > poll.endTime
      },
      options: resultsWithPercentages,
      userVoted: !!userVote,
      userSelection: userVote ? userVote.optionId : null
    };

    console.log('📊 Final results:', {
      totalVotes: results.poll.totalVotes,
      options: results.options.map(o => ({ text: o.text, votes: o.voteCount, percentage: o.percentage })),
      userVoted: results.userVoted
    });

    logger.info(`Poll results retrieved for poll ${pollId} by user ${userId}`);

    return res.json({
      success: true,
      message: 'Poll results retrieved successfully',
      data: results
    });
  } catch (error) {
    console.error('📊 Get poll results error:', error);
    logger.error('Get poll results error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve poll results'
    });
  }
};
