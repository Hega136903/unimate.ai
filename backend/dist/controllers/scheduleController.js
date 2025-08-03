"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScheduleAnalytics = exports.createStudySession = exports.getSmartSuggestions = exports.deleteScheduleItem = exports.updateScheduleItem = exports.createScheduleItem = exports.getStudentSchedule = void 0;
const logger_1 = require("../utils/logger");
let schedules = [
    {
        id: 'sch_1',
        title: 'Data Structures & Algorithms',
        description: 'Trees and Graph algorithms',
        type: 'class',
        startTime: new Date('2025-08-01T09:00:00'),
        endTime: new Date('2025-08-01T10:30:00'),
        location: 'Room 301, Computer Science Building',
        course: 'CS-301',
        professor: 'Dr. Sarah Johnson',
        priority: 'high',
        status: 'scheduled',
        isRecurring: true,
        recurrencePattern: {
            frequency: 'weekly',
            daysOfWeek: [1, 3, 5],
            endDate: new Date('2025-12-15')
        },
        reminders: [
            { time: 15, sent: false },
            { time: 5, sent: false }
        ],
        color: '#3B82F6',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'sch_2',
        title: 'Machine Learning Assignment',
        description: 'Implement neural network from scratch',
        type: 'assignment',
        startTime: new Date('2025-08-03T14:00:00'),
        endTime: new Date('2025-08-03T18:00:00'),
        course: 'ML-401',
        professor: 'Dr. Michael Chen',
        priority: 'urgent',
        status: 'scheduled',
        isRecurring: false,
        reminders: [
            { time: 60, sent: false },
            { time: 30, sent: false },
            { time: 10, sent: false }
        ],
        color: '#EF4444',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'sch_3',
        title: 'Database Systems Midterm',
        description: 'Covers SQL, NoSQL, and database design',
        type: 'exam',
        startTime: new Date('2025-08-05T10:00:00'),
        endTime: new Date('2025-08-05T12:00:00'),
        location: 'Exam Hall B',
        course: 'DB-302',
        professor: 'Dr. Emily Davis',
        priority: 'urgent',
        status: 'scheduled',
        isRecurring: false,
        reminders: [
            { time: 1440, sent: false },
            { time: 180, sent: false },
            { time: 30, sent: false }
        ],
        color: '#DC2626',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];
let studySessions = [];
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
        let filteredSchedule = schedules;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            filteredSchedule = schedules.filter(item => item.startTime >= start && item.startTime <= end);
        }
        if (type && type !== 'all') {
            filteredSchedule = filteredSchedule.filter(item => item.type === type);
        }
        filteredSchedule.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        logger_1.logger.info(`Schedule retrieved for user ${userId}: ${filteredSchedule.length} items`);
        return res.json({
            success: true,
            message: 'Schedule retrieved successfully',
            data: {
                schedule: filteredSchedule,
                totalItems: filteredSchedule.length,
                upcomingItems: filteredSchedule.filter(item => item.startTime > new Date() && item.status === 'scheduled').length
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get student schedule error:', error);
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
        const { title, description, type, startTime, endTime, location, course, professor, priority, isRecurring, recurrencePattern, reminders, color } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        if (!title || !type || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Title, type, start time, and end time are required'
            });
        }
        const newItem = {
            id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            description,
            type,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            location,
            course,
            professor,
            priority: priority || 'medium',
            status: 'scheduled',
            isRecurring: isRecurring || false,
            recurrencePattern,
            reminders: reminders || [{ time: 15, sent: false }],
            color: color || '#3B82F6',
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        schedules.push(newItem);
        logger_1.logger.info(`Schedule item created: ${newItem.id} by user ${userId}`);
        return res.status(201).json({
            success: true,
            message: 'Schedule item created successfully',
            data: newItem
        });
    }
    catch (error) {
        logger_1.logger.error('Create schedule item error:', error);
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
        const updates = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const itemIndex = schedules.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Schedule item not found'
            });
        }
        const updatedItem = {
            ...schedules[itemIndex],
            ...updates,
            updatedAt: new Date()
        };
        schedules[itemIndex] = updatedItem;
        logger_1.logger.info(`Schedule item updated: ${itemId} by user ${userId}`);
        return res.json({
            success: true,
            message: 'Schedule item updated successfully',
            data: updatedItem
        });
    }
    catch (error) {
        logger_1.logger.error('Update schedule item error:', error);
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
        const itemIndex = schedules.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Schedule item not found'
            });
        }
        schedules.splice(itemIndex, 1);
        logger_1.logger.info(`Schedule item deleted: ${itemId} by user ${userId}`);
        return res.json({
            success: true,
            message: 'Schedule item deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Delete schedule item error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete schedule item'
        });
    }
};
exports.deleteScheduleItem = deleteScheduleItem;
const getSmartSuggestions = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        const thisWeekSchedule = schedules.filter(item => item.startTime >= todayStart && item.startTime <= weekEnd);
        const suggestions = {
            studyRecommendations: [
                {
                    subject: 'Database Systems',
                    reason: 'Midterm exam in 4 days',
                    suggestedTime: '2025-08-01T19:00:00',
                    duration: 120,
                    priority: 'urgent'
                },
                {
                    subject: 'Machine Learning',
                    reason: 'Assignment due soon',
                    suggestedTime: '2025-08-02T16:00:00',
                    duration: 180,
                    priority: 'high'
                }
            ],
            conflictAlerts: [],
            optimizationTips: [
                'Consider grouping similar subjects for better focus',
                'Schedule breaks between intensive study sessions',
                'Review material 24 hours before exams for better retention'
            ],
            freeTimeSlots: [
                {
                    date: '2025-08-01',
                    slots: [
                        { start: '14:00', end: '16:00', duration: 120 },
                        { start: '19:00', end: '21:00', duration: 120 }
                    ]
                },
                {
                    date: '2025-08-02',
                    slots: [
                        { start: '10:00', end: '12:00', duration: 120 },
                        { start: '15:00', end: '17:00', duration: 120 }
                    ]
                }
            ]
        };
        thisWeekSchedule.forEach((item, index) => {
            thisWeekSchedule.slice(index + 1).forEach(other => {
                if (item.startTime < other.endTime && other.startTime < item.endTime) {
                    suggestions.conflictAlerts.push({
                        item1: item.title,
                        item2: other.title,
                        time: item.startTime,
                        severity: 'high'
                    });
                }
            });
        });
        logger_1.logger.info(`Smart suggestions generated for user ${userId}`);
        return res.json({
            success: true,
            message: 'Smart suggestions generated successfully',
            data: suggestions
        });
    }
    catch (error) {
        logger_1.logger.error('Get smart suggestions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate smart suggestions'
        });
    }
};
exports.getSmartSuggestions = getSmartSuggestions;
const createStudySession = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { subject, topic, duration, goals } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        if (!subject || !topic || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Subject, topic, and duration are required'
            });
        }
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        let suggestedTime = new Date(now.getTime() + 60 * 60 * 1000);
        const newSession = {
            id: `study_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            subject,
            topic,
            duration,
            scheduledTime: suggestedTime,
            goals: goals || [],
            completed: false,
            productivity: 0,
            studentId: userId
        };
        studySessions.push(newSession);
        const scheduleItem = {
            id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: `Study Session: ${subject}`,
            description: `Topic: ${topic}`,
            type: 'study-session',
            startTime: suggestedTime,
            endTime: new Date(suggestedTime.getTime() + duration * 60 * 1000),
            priority: 'medium',
            status: 'scheduled',
            isRecurring: false,
            reminders: [{ time: 15, sent: false }],
            color: '#10B981',
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        schedules.push(scheduleItem);
        logger_1.logger.info(`Study session created: ${newSession.id} by user ${userId}`);
        return res.status(201).json({
            success: true,
            message: 'Study session created successfully',
            data: {
                session: newSession,
                scheduleItem: scheduleItem
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Create study session error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create study session'
        });
    }
};
exports.createStudySession = createStudySession;
const getScheduleAnalytics = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const now = new Date();
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weeklySchedule = schedules.filter(item => item.startTime >= weekStart && item.startTime <= now);
        const analytics = {
            totalScheduledHours: weeklySchedule.reduce((total, item) => {
                const duration = (item.endTime.getTime() - item.startTime.getTime()) / (1000 * 60 * 60);
                return total + duration;
            }, 0),
            completedTasks: weeklySchedule.filter(item => item.status === 'completed').length,
            missedTasks: weeklySchedule.filter(item => item.status === 'missed').length,
            productivityScore: 85,
            typeDistribution: {
                class: weeklySchedule.filter(item => item.type === 'class').length,
                assignment: weeklySchedule.filter(item => item.type === 'assignment').length,
                exam: weeklySchedule.filter(item => item.type === 'exam').length,
                'study-session': weeklySchedule.filter(item => item.type === 'study-session').length,
                personal: weeklySchedule.filter(item => item.type === 'personal').length
            },
            peakHours: ['09:00', '14:00', '19:00'],
            recommendations: [
                'Consider scheduling study sessions during your peak hours',
                'Add buffer time between back-to-back classes',
                'Review your weekly goals every Sunday'
            ]
        };
        logger_1.logger.info(`Schedule analytics retrieved for user ${userId}`);
        return res.json({
            success: true,
            message: 'Schedule analytics retrieved successfully',
            data: analytics
        });
    }
    catch (error) {
        logger_1.logger.error('Get schedule analytics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve schedule analytics'
        });
    }
};
exports.getScheduleAnalytics = getScheduleAnalytics;
//# sourceMappingURL=scheduleController.js.map