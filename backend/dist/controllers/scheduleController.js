"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeUserSchedule = exports.getScheduleAnalytics = exports.getAISuggestions = exports.getUpcomingDeadlines = exports.deleteScheduleItem = exports.updateScheduleItem = exports.createScheduleItem = exports.getStudentSchedule = void 0;
const logger_1 = require("../utils/logger");
const Schedule_1 = __importDefault(require("../models/Schedule"));
const getStudentSchedule = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { startDate, endDate, type } = req.query;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        console.log('📅 Getting schedule for user:', userId);
        const query = { createdBy: userId };
        if (type && type !== 'all') {
            query.type = type;
        }
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            query.$or = [
                {
                    startTime: {
                        $gte: start,
                        $lte: end
                    }
                },
                {
                    endTime: {
                        $gte: start,
                        $lte: end
                    }
                },
                {
                    startTime: { $lte: start },
                    endTime: { $gte: end }
                }
            ];
        }
        const scheduleItems = await Schedule_1.default.find(query).sort({ startTime: 1 });
        console.log(`📅 Found ${scheduleItems.length} schedule items`);
        const transformedItems = scheduleItems.map(item => ({
            id: item._id.toString(),
            title: item.title,
            description: item.description,
            type: item.type,
            startTime: item.startTime.toISOString(),
            endTime: item.endTime.toISOString(),
            location: item.location,
            course: item.course,
            professor: item.professor,
            priority: item.priority,
            status: item.status,
            color: item.color || '#3B82F6',
            isRecurring: item.isRecurring,
            recurrencePattern: item.recurrencePattern,
            reminders: item.reminders,
            notes: item.notes
        }));
        return res.json({
            success: true,
            message: 'Schedule retrieved successfully',
            data: transformedItems
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting student schedule:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve schedule'
        });
    }
};
exports.getStudentSchedule = getStudentSchedule;
const createScheduleItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const { title, description, type, startTime, endTime, location, course, professor, priority = 'medium', color = '#3B82F6', isRecurring = false, recurrencePattern, reminders = [] } = req.body;
        if (!title || !type || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Title, type, start time, and end time are required'
            });
        }
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: 'End time must be after start time'
            });
        }
        const scheduleItem = new Schedule_1.default({
            title,
            description,
            type,
            startTime: start,
            endTime: end,
            location,
            course,
            professor,
            priority,
            status: 'scheduled',
            color,
            isRecurring,
            recurrencePattern,
            reminders,
            createdBy: userId
        });
        await scheduleItem.save();
        console.log('📅 Created schedule item:', title);
        return res.status(201).json({
            success: true,
            message: 'Schedule item created successfully',
            data: {
                id: scheduleItem._id.toString(),
                title: scheduleItem.title,
                description: scheduleItem.description,
                type: scheduleItem.type,
                startTime: scheduleItem.startTime.toISOString(),
                endTime: scheduleItem.endTime.toISOString(),
                location: scheduleItem.location,
                course: scheduleItem.course,
                professor: scheduleItem.professor,
                priority: scheduleItem.priority,
                status: scheduleItem.status,
                color: scheduleItem.color
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating schedule item:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create schedule item'
        });
    }
};
exports.createScheduleItem = createScheduleItem;
const updateScheduleItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { itemId } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const scheduleItem = await Schedule_1.default.findOne({
            _id: itemId,
            createdBy: userId
        });
        if (!scheduleItem) {
            return res.status(404).json({
                success: false,
                message: 'Schedule item not found'
            });
        }
        const updateData = { ...req.body };
        delete updateData.createdBy;
        if (updateData.startTime && updateData.endTime) {
            const start = new Date(updateData.startTime);
            const end = new Date(updateData.endTime);
            if (end <= start) {
                return res.status(400).json({
                    success: false,
                    message: 'End time must be after start time'
                });
            }
        }
        const updatedItem = await Schedule_1.default.findByIdAndUpdate(itemId, updateData, { new: true });
        console.log('📅 Updated schedule item:', updatedItem?.title);
        return res.json({
            success: true,
            message: 'Schedule item updated successfully',
            data: {
                id: updatedItem?._id?.toString(),
                title: updatedItem?.title,
                description: updatedItem?.description,
                type: updatedItem?.type,
                startTime: updatedItem?.startTime.toISOString(),
                endTime: updatedItem?.endTime.toISOString(),
                location: updatedItem?.location,
                course: updatedItem?.course,
                professor: updatedItem?.professor,
                priority: updatedItem?.priority,
                status: updatedItem?.status,
                color: updatedItem?.color
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating schedule item:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update schedule item'
        });
    }
};
exports.updateScheduleItem = updateScheduleItem;
const deleteScheduleItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { itemId } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const result = await Schedule_1.default.findOneAndDelete({
            _id: itemId,
            createdBy: userId
        });
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Schedule item not found'
            });
        }
        console.log('📅 Deleted schedule item:', result.title);
        return res.json({
            success: true,
            message: 'Schedule item deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting schedule item:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete schedule item'
        });
    }
};
exports.deleteScheduleItem = deleteScheduleItem;
const getUpcomingDeadlines = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { hours = 24 } = req.query;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const deadlines = await Schedule_1.default.getUpcomingDeadlines(userId, Number(hours));
        const transformedDeadlines = deadlines.map((item) => ({
            id: item._id.toString(),
            title: item.title,
            description: item.description,
            type: item.type,
            startTime: item.startTime.toISOString(),
            endTime: item.endTime.toISOString(),
            course: item.course,
            professor: item.professor,
            priority: item.priority,
            timeRemaining: item.endTime.getTime() - Date.now()
        }));
        return res.json({
            success: true,
            message: 'Upcoming deadlines retrieved successfully',
            data: transformedDeadlines
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting upcoming deadlines:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve deadlines'
        });
    }
};
exports.getUpcomingDeadlines = getUpcomingDeadlines;
const getAISuggestions = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const scheduleItems = await Schedule_1.default.find({ createdBy: userId }).sort({ startTime: 1 });
        const suggestions = {
            studyRecommendations: [
                {
                    subject: "Review upcoming assignments",
                    reason: "You have assignments due soon",
                    suggestedTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                    duration: 120,
                    priority: "high"
                }
            ],
            conflictAlerts: [],
            optimizationTips: [
                "Consider breaking large tasks into smaller chunks",
                "Schedule breaks between intensive study sessions",
                "Set reminders for important deadlines"
            ],
            freeTimeSlots: []
        };
        return res.json({
            success: true,
            message: 'AI suggestions generated successfully',
            data: suggestions
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating AI suggestions:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate suggestions'
        });
    }
};
exports.getAISuggestions = getAISuggestions;
const getScheduleAnalytics = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const scheduleItems = await Schedule_1.default.find({ createdBy: userId });
        const totalScheduledHours = scheduleItems.reduce((total, item) => {
            const duration = (item.endTime.getTime() - item.startTime.getTime()) / (1000 * 60 * 60);
            return total + duration;
        }, 0);
        const completedTasks = scheduleItems.filter(item => item.status === 'completed').length;
        const missedTasks = scheduleItems.filter(item => item.status === 'missed').length;
        const typeDistribution = {};
        scheduleItems.forEach(item => {
            typeDistribution[item.type] = (typeDistribution[item.type] || 0) + 1;
        });
        const analytics = {
            totalScheduledHours: Math.round(totalScheduledHours * 10) / 10,
            completedTasks,
            missedTasks,
            productivityScore: completedTasks > 0 ? Math.round((completedTasks / (completedTasks + missedTasks)) * 100) : 0,
            typeDistribution,
            peakHours: ["9:00 AM", "2:00 PM"],
            recommendations: [
                "Schedule more study sessions during your peak hours",
                "Set up more reminders for important deadlines",
                "Consider time blocking for better focus"
            ]
        };
        return res.json({
            success: true,
            message: 'Analytics retrieved successfully',
            data: analytics
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting schedule analytics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve analytics'
        });
    }
};
exports.getScheduleAnalytics = getScheduleAnalytics;
const initializeUserSchedule = (userId) => {
    console.log('📅 User schedule initialization called for:', userId);
    return [];
};
exports.initializeUserSchedule = initializeUserSchedule;
//# sourceMappingURL=scheduleController.js.map