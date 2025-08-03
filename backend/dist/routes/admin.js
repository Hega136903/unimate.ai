"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const Vote_1 = __importDefault(require("../models/Vote"));
const Poll_1 = __importDefault(require("../models/Poll"));
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const votingController_1 = require("../controllers/votingController");
const router = express_1.default.Router();
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
        return;
    }
    next();
};
router.get('/stats', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [totalPolls, activePolls, totalVotes, totalUsers] = await Promise.all([
            Poll_1.default.countDocuments(),
            Poll_1.default.countDocuments({ isActive: true }),
            Vote_1.default.countDocuments(),
            User_1.User.countDocuments()
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching admin stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/polls', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log('📋 Admin requesting all polls...');
        const polls = await Poll_1.default.find()
            .sort({ createdAt: -1 })
            .populate('createdBy', 'firstName lastName email');
        console.log('📋 Found polls from database:', polls.length);
        console.log('📋 Poll details:', polls.map(p => ({
            id: p._id,
            title: p.title,
            options: p.options.length,
            optionDetails: p.options
        })));
        const pollsWithVotes = await Promise.all(polls.map(async (poll) => {
            try {
                const votes = await Vote_1.default.find({ pollId: poll._id });
                const totalVotes = votes.length;
                console.log(`📋 Poll "${poll.title}" has ${totalVotes} votes from database`);
                const optionVotes = poll.options.map((option) => {
                    const optionVoteCount = votes.filter((vote) => vote.optionId === option.id).length;
                    console.log(`📋 Option "${option.text}" (id: ${option.id}) has ${optionVoteCount} votes`);
                    return {
                        id: option.id,
                        text: option.text,
                        description: option.description || '',
                        voteCount: optionVoteCount,
                        percentage: totalVotes > 0 ? Math.round((optionVoteCount / totalVotes) * 100) : 0
                    };
                });
                if (totalVotes !== poll.totalVotes) {
                    console.log(`📋 Updating poll totalVotes from ${poll.totalVotes} to ${totalVotes}`);
                    await Poll_1.default.findByIdAndUpdate(poll._id, {
                        totalVotes: totalVotes,
                        options: optionVotes.map((ov) => ({
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
                    options: pollWithVotes.options.map((o) => ({
                        id: o.id,
                        text: o.text,
                        voteCount: o.voteCount
                    }))
                });
                return pollWithVotes;
            }
            catch (error) {
                console.error(`📋 Error processing poll ${poll.title}:`, error);
                return {
                    ...poll.toObject(),
                    totalVotes: 0,
                    options: poll.options.map((option) => ({
                        ...option.toObject(),
                        voteCount: 0,
                        percentage: 0
                    }))
                };
            }
        }));
        console.log('📋 Sending polls to admin panel:', pollsWithVotes.length);
        res.json({
            success: true,
            data: pollsWithVotes
        });
    }
    catch (error) {
        console.error('📋 Error fetching admin polls:', error);
        logger_1.logger.error('Error fetching polls:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/polls', [
    auth_1.authenticateToken,
    requireAdmin,
    (0, express_validator_1.body)('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
    (0, express_validator_1.body)('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
    (0, express_validator_1.body)('options').isArray({ min: 2 }).withMessage('At least 2 options are required'),
    (0, express_validator_1.body)('options.*.text').trim().isLength({ min: 1 }).withMessage('Option text is required'),
    (0, express_validator_1.body)('startTime').isISO8601().withMessage('Valid start time is required'),
    (0, express_validator_1.body)('endTime').isISO8601().withMessage('Valid end time is required'),
    (0, express_validator_1.body)('category').isIn(['student-election', 'campus-decision', 'feedback']).withMessage('Valid category is required')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
            return;
        }
        const { title, description, options, startTime, endTime, category, isAnonymous = true } = req.body;
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
        const pollOptions = options.map((option, index) => ({
            id: `option_${Date.now()}_${index}`,
            text: option.text.trim(),
            description: option.description?.trim() || '',
            voteCount: 0
        }));
        const poll = new Poll_1.default({
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
        logger_1.logger.info(`Admin ${req.user.email} created poll: ${title}`);
        res.status(201).json({
            success: true,
            message: 'Poll created successfully',
            data: poll
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating poll:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.patch('/polls/:pollId/toggle', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { pollId } = req.params;
        const { isActive } = req.body;
        const poll = await Poll_1.default.findById(pollId);
        if (!poll) {
            res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
            return;
        }
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
        if (isActive && poll.endTime <= now) {
            console.log('❌ Cannot activate poll - poll has already ended');
            res.status(400).json({
                success: false,
                message: `Cannot activate poll that has already ended. End time: ${poll.endTime}, Current time: ${now}`
            });
            return;
        }
        if (isActive && poll.startTime > now) {
            console.log('⚠️ Activating future poll - will become available to students at start time');
        }
        poll.isActive = isActive;
        await poll.save();
        logger_1.logger.info(`Admin ${req.user?.email} ${isActive ? 'activated' : 'deactivated'} poll: ${poll.title}`);
        res.json({
            success: true,
            message: `Poll ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: poll
        });
    }
    catch (error) {
        logger_1.logger.error('Error toggling poll status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.delete('/polls/:pollId', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { pollId } = req.params;
        const poll = await Poll_1.default.findById(pollId);
        if (!poll) {
            res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
            return;
        }
        await Vote_1.default.deleteMany({ pollId });
        await Poll_1.default.findByIdAndDelete(pollId);
        logger_1.logger.info(`Admin ${req.user?.email} deleted poll: ${poll.title}`);
        res.json({
            success: true,
            message: 'Poll deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting poll:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/polls/:pollId/analytics', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { pollId } = req.params;
        const poll = await Poll_1.default.findById(pollId);
        if (!poll) {
            res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
            return;
        }
        const votes = await Vote_1.default.find({ pollId }).populate('userId', 'firstName lastName email department year');
        const analytics = {
            totalVotes: votes.length,
            votesByOption: poll.options.map((option) => ({
                option: option.text,
                votes: votes.filter((vote) => vote.optionId === option.id).length,
                percentage: votes.length > 0 ? Math.round((votes.filter((vote) => vote.optionId === option.id).length / votes.length) * 100) : 0
            })),
            votesByDepartment: {},
            votesByYear: {},
            votingTimeline: votes.map((vote) => ({
                timestamp: vote.createdAt,
                option: poll.options.find((opt) => opt.id === vote.optionId)?.text
            })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        };
        if (!poll.isAnonymous) {
            votes.forEach((vote) => {
                if (vote.userId) {
                    const user = vote.userId;
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching poll analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/users', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', role = '' } = req.query;
        const query = {};
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
        const users = await User_1.User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const total = await User_1.User.countDocuments(query);
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/cleanup', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log('🧹 Admin cleanup request received');
        const deletedCount = await (0, votingController_1.cleanupInvalidVotes)();
        res.json({
            success: true,
            message: `Cleanup completed. Removed ${deletedCount} invalid votes.`,
            data: { deletedCount }
        });
    }
    catch (error) {
        logger_1.logger.error('Error during cleanup:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during cleanup'
        });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map