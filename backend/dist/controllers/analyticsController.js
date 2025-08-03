"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminAnalytics = exports.getUsageAnalytics = exports.getDashboardAnalytics = void 0;
const logger_1 = require("../utils/logger");
const getDashboardAnalytics = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const analytics = await fetchDashboardAnalytics(userId);
        logger_1.logger.info(`Dashboard analytics retrieved for user ${userId}`);
        return res.json({
            success: true,
            message: 'Dashboard analytics retrieved successfully',
            data: analytics
        });
    }
    catch (error) {
        logger_1.logger.error('Dashboard analytics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard analytics'
        });
    }
};
exports.getDashboardAnalytics = getDashboardAnalytics;
const getUsageAnalytics = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const usage = await fetchUsageAnalytics(userId);
        logger_1.logger.info(`Usage analytics retrieved for user ${userId}`);
        return res.json({
            success: true,
            message: 'Usage analytics retrieved successfully',
            data: usage
        });
    }
    catch (error) {
        logger_1.logger.error('Usage analytics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve usage analytics'
        });
    }
};
exports.getUsageAnalytics = getUsageAnalytics;
const getAdminAnalytics = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        const adminAnalytics = await fetchAdminAnalytics();
        logger_1.logger.info(`Admin analytics retrieved by user ${userId}`);
        return res.json({
            success: true,
            message: 'Admin analytics retrieved successfully',
            data: adminAnalytics
        });
    }
    catch (error) {
        logger_1.logger.error('Admin analytics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve admin analytics'
        });
    }
};
exports.getAdminAnalytics = getAdminAnalytics;
async function fetchDashboardAnalytics(userId) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
        totalUsers: 1250,
        activeUsers: 847,
        aiQuestionsAsked: 3420,
        studySessionsCreated: 156,
        popularFeatures: [
            'AI Study Assistant',
            'Smart Scheduling',
            'Portfolio Builder',
            'Campus Voting'
        ],
        userStats: {
            questionsThisWeek: 12,
            sessionsThisWeek: 3,
            averageScore: 85,
            studyStreak: 7
        },
        recentActivity: [
            { type: 'ai_question', timestamp: '2024-01-15T10:30:00Z', description: 'Asked about calculus' },
            { type: 'study_session', timestamp: '2024-01-15T09:00:00Z', description: 'Completed CS101 session' },
            { type: 'portfolio_update', timestamp: '2024-01-14T16:45:00Z', description: 'Updated portfolio' }
        ]
    };
}
async function fetchUsageAnalytics(userId) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
        dailyUsage: [
            { date: '2024-01-10', questions: 5, sessions: 2, timeSpent: 120 },
            { date: '2024-01-11', questions: 3, sessions: 1, timeSpent: 90 },
            { date: '2024-01-12', questions: 7, sessions: 3, timeSpent: 180 },
            { date: '2024-01-13', questions: 4, sessions: 2, timeSpent: 150 },
            { date: '2024-01-14', questions: 6, sessions: 2, timeSpent: 140 },
            { date: '2024-01-15', questions: 8, sessions: 4, timeSpent: 200 }
        ],
        featureUsage: [
            { feature: 'AI Study Assistant', usage: 65, satisfaction: 4.5 },
            { feature: 'Smart Scheduling', usage: 45, satisfaction: 4.2 },
            { feature: 'Portfolio Builder', usage: 30, satisfaction: 4.7 },
            { feature: 'Campus Voting', usage: 20, satisfaction: 4.0 }
        ],
        studyPatterns: {
            preferredTime: 'Evening (6-9 PM)',
            averageSessionLength: 45,
            mostActiveDay: 'Wednesday',
            totalStudyTime: 880
        }
    };
}
async function fetchAdminAnalytics() {
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
        platformStats: {
            totalUsers: 1250,
            activeUsers: 847,
            newUsersThisMonth: 89,
            retentionRate: 78.5
        },
        featureUsage: {
            aiQuestions: 3420,
            studySessions: 156,
            portfoliosCreated: 234,
            votesCast: 567
        },
        userEngagement: {
            averageSessionTime: 45,
            dailyActiveUsers: 234,
            weeklyActiveUsers: 847,
            monthlyActiveUsers: 1250
        },
        systemPerformance: {
            averageResponseTime: 1.2,
            uptime: 99.8,
            errorRate: 0.1,
            serverLoad: 65
        },
        topUniversities: [
            { name: 'MIT', users: 156, engagement: 85 },
            { name: 'Stanford', users: 134, engagement: 82 },
            { name: 'Harvard', users: 98, engagement: 79 },
            { name: 'UC Berkeley', users: 87, engagement: 76 }
        ]
    };
}
//# sourceMappingURL=analyticsController.js.map