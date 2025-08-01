import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import Poll, { IPoll } from '../models/Poll';
// import Vote from '../models/Vote'; // Vote model is empty, using in-memory for now

// Interfaces for voting system
interface Vote {
  id: string;
  voterId: string;
  pollId: string;
  optionId: string;
  timestamp: Date;
  isAnonymous: boolean;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  createdBy: string;
  createdAt: Date;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  isAnonymous: boolean;
  allowedVoters: string[]; // user IDs or 'all'
  category: 'student-election' | 'campus-decision' | 'feedback' | 'other';
  totalVotes: number;
}

interface PollOption {
  id: string;
  text: string;
  description?: string;
  voteCount: number;
}

// In-memory storage (replace with database in production)
let polls: Poll[] = [];

let votes: Vote[] = [];

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
    const pollsWithVoteStatus = activePolls.map(poll => {
      const userHasVoted = votes.some(vote => 
        vote.pollId === (poll._id as any).toString() && vote.voterId === userId
      );

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
    });

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

    const userHasVoted = votes.some(vote => 
      vote.pollId === pollId && vote.voterId === userId
    );

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

    if (!userId) {
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
    const existingVote = votes.find(vote => 
      vote.pollId === pollId && vote.voterId === userId
    );

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

    // Create new vote
    const newVote: Vote = {
      id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      voterId: userId,
      pollId,
      optionId,
      timestamp: new Date(),
      isAnonymous: poll.isAnonymous
    };

    // Add vote to in-memory storage (until Vote model is implemented)
    votes.push(newVote);

    // Update vote counts in the database
    const optionIndex = poll.options.findIndex(opt => opt.id === optionId);
    if (optionIndex !== -1) {
      poll.options[optionIndex] = {
        ...poll.options[optionIndex],
        voteCount: (poll.options[optionIndex].voteCount || 0) + 1
      };
    }

    // Calculate total votes
    const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);
    
    // Update the poll in database
    await Poll.findByIdAndUpdate(pollId, {
      options: poll.options,
      totalVotes: totalVotes
    });

    logger.info(`Vote cast successfully: Poll ${pollId}, Option ${optionId}, User ${userId}`);

    return res.json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        voteId: newVote.id,
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

    // Calculate total votes from options
    const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);

    // Calculate percentages
    const resultsWithPercentages = poll.options.map(option => ({
      ...option,
      percentage: totalVotes > 0 ? Math.round(((option.voteCount || 0) / totalVotes) * 100) : 0
    }));

    const userVote = votes.find(vote => 
      vote.pollId === pollId && vote.voterId === userId
    );

    const results = {
      poll: {
        id: (poll._id as any).toString(),
        title: poll.title,
        description: poll.description,
        totalVotes: totalVotes,
        endTime: poll.endTime,
        isActive: poll.isActive
      },
      options: resultsWithPercentages,
      userVoted: !!userVote,
      userSelection: userVote ? userVote.optionId : null
    };

    logger.info(`Poll results retrieved for poll ${pollId} by user ${userId}`);

    return res.json({
      success: true,
      message: 'Poll results retrieved successfully',
      data: results
    });
  } catch (error) {
    logger.error('Get poll results error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve poll results'
    });
  }
};

// Create new poll (admin only)
export const createPoll = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { title, description, options, startTime, endTime, isAnonymous, category } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create polls'
      });
    }

    if (!title || !description || !options || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and at least 2 options are required'
      });
    }

    const newPoll: Poll = {
      id: `poll_${Date.now()}`,
      title,
      description,
      options: options.map((opt: string, index: number) => ({
        id: `opt_${Date.now()}_${index}`,
        text: opt,
        voteCount: 0
      })),
      createdBy: userId,
      createdAt: new Date(),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isActive: true,
      isAnonymous: isAnonymous || true,
      allowedVoters: ['all'],
      category: category || 'other',
      totalVotes: 0
    };

    polls.push(newPoll);

    logger.info(`New poll created: ${newPoll.id} by user ${userId}`);

    return res.status(201).json({
      success: true,
      message: 'Poll created successfully',
      data: newPoll
    });
  } catch (error) {
    logger.error('Create poll error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create poll'
    });
  }
};
