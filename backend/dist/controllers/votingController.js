"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPollResults = exports.castVote = exports.getPollDetails = exports.getActivePolls = exports.cleanupInvalidVotes = void 0;
const logger_1 = require("../utils/logger");
const Poll_1 = __importDefault(require("../models/Poll"));
const Vote_1 = __importDefault(require("../models/Vote"));
const cleanupInvalidVotes = async () => {
    try {
        console.log('🧹 Starting vote cleanup...');
        const deleteResult = await Vote_1.default.deleteMany({
            $or: [
                { voterId: null },
                { voterId: undefined },
                { voterId: '' }
            ]
        });
        console.log(`🧹 Removed ${deleteResult.deletedCount} invalid votes`);
        return deleteResult.deletedCount;
    }
    catch (error) {
        console.error('🧹 Cleanup error:', error);
        return 0;
    }
};
exports.cleanupInvalidVotes = cleanupInvalidVotes;
const getActivePolls = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const now = new Date();
        console.log('🔍 Fetching polls with criteria:', {
            isActive: true,
            startTime: { $lte: now },
            endTime: { $gte: now },
            currentTime: now
        });
        const activePolls = await Poll_1.default.find({
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
        const allPolls = await Poll_1.default.find({}).sort({ createdAt: -1 });
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
        const pollsWithVoteStatus = await Promise.all(activePolls.map(async (poll) => {
            const userVote = await Vote_1.default.findOne({
                pollId: poll._id,
                voterId: userId
            });
            const userHasVoted = !!userVote;
            const canVote = poll.isActive &&
                now >= poll.startTime &&
                now <= poll.endTime &&
                !userHasVoted;
            const pollObj = poll.toObject();
            return {
                ...pollObj,
                id: poll._id.toString(),
                userHasVoted,
                canVote,
                timeRemaining: poll.endTime.getTime() - now.getTime()
            };
        }));
        logger_1.logger.info(`Active polls retrieved for user ${userId}: ${activePolls.length} polls`);
        return res.json({
            success: true,
            message: 'Active polls retrieved successfully',
            data: pollsWithVoteStatus
        });
    }
    catch (error) {
        logger_1.logger.error('Get active polls error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve active polls'
        });
    }
};
exports.getActivePolls = getActivePolls;
const getPollDetails = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { pollId } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const poll = await Poll_1.default.findById(pollId);
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }
        const userVote = await Vote_1.default.findOne({
            pollId: poll._id,
            voterId: userId
        });
        const userHasVoted = !!userVote;
        const now = new Date();
        const pollObj = poll.toObject();
        const pollWithStatus = {
            ...pollObj,
            id: poll._id.toString(),
            userHasVoted,
            timeRemaining: poll.endTime.getTime() - now.getTime(),
            canVote: poll.isActive && now >= poll.startTime && now <= poll.endTime && !userHasVoted
        };
        logger_1.logger.info(`Poll details retrieved for poll ${pollId} by user ${userId}`);
        return res.json({
            success: true,
            message: 'Poll details retrieved successfully',
            data: pollWithStatus
        });
    }
    catch (error) {
        logger_1.logger.error('Get poll details error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve poll details'
        });
    }
};
exports.getPollDetails = getPollDetails;
const castVote = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { pollId, optionId } = req.body;
        console.log('🗳️ Cast vote request:', {
            userId,
            pollId,
            optionId,
            userObject: req.user,
            authHeader: req.headers.authorization
        });
        if (!userId) {
            console.log('❌ No userId found in request.user:', req.user);
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
        const poll = await Poll_1.default.findById(pollId);
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }
        const now = new Date();
        if (!poll.isActive || now < poll.startTime || now > poll.endTime) {
            return res.status(400).json({
                success: false,
                message: 'Poll is not currently active for voting'
            });
        }
        const existingVote = await Vote_1.default.findOne({
            pollId: pollId,
            voterId: userId
        });
        if (existingVote) {
            return res.status(400).json({
                success: false,
                message: 'You have already voted in this poll'
            });
        }
        const option = poll.options.find(opt => opt.id === optionId);
        if (!option) {
            return res.status(400).json({
                success: false,
                message: 'Invalid option selected'
            });
        }
        const newVote = new Vote_1.default({
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
        }
        catch (saveError) {
            console.error('❌ Vote save error:', saveError);
            if (saveError.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already voted in this poll'
                });
            }
            throw saveError;
        }
        await Poll_1.default.findByIdAndUpdate(pollId, {
            $inc: {
                [`options.$[elem].voteCount`]: 1,
                totalVotes: 1
            }
        }, {
            arrayFilters: [{ 'elem.id': optionId }],
            new: true
        });
        console.log(`✅ Vote cast successfully: Poll ${pollId}, Option ${optionId}, User ${userId}`);
        logger_1.logger.info(`Vote cast successfully: Poll ${pollId}, Option ${optionId}, User ${userId}`);
        return res.json({
            success: true,
            message: 'Vote cast successfully',
            data: {
                voteId: newVote._id.toString(),
                pollTitle: poll.title,
                selectedOption: option.text,
                timestamp: newVote.timestamp
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Cast vote error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to cast vote'
        });
    }
};
exports.castVote = castVote;
const getPollResults = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { pollId } = req.params;
        console.log('📊 Getting poll results for pollId:', pollId, 'userId:', userId);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const poll = await Poll_1.default.findById(pollId);
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
        const votes = await Vote_1.default.find({ pollId: poll._id });
        console.log('📊 Found votes:', votes.length, votes.map(v => ({ optionId: v.optionId, voterId: v.voterId })));
        const optionsWithVotes = poll.options.map((option) => {
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
        const totalVotes = votes.length;
        console.log('📊 Total votes:', totalVotes);
        const resultsWithPercentages = optionsWithVotes.map(option => ({
            ...option,
            percentage: totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0
        }));
        const userVote = await Vote_1.default.findOne({
            pollId: poll._id,
            voterId: userId
        });
        console.log('📊 User vote:', userVote ? { optionId: userVote.optionId } : 'No vote found');
        const results = {
            poll: {
                id: poll._id.toString(),
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
        logger_1.logger.info(`Poll results retrieved for poll ${pollId} by user ${userId}`);
        return res.json({
            success: true,
            message: 'Poll results retrieved successfully',
            data: results
        });
    }
    catch (error) {
        console.error('📊 Get poll results error:', error);
        logger_1.logger.error('Get poll results error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve poll results'
        });
    }
};
exports.getPollResults = getPollResults;
//# sourceMappingURL=votingController.js.map