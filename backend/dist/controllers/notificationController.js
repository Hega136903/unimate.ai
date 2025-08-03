"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationPreferences = exports.getNotificationHistory = exports.testEmailService = exports.sendDeadlineAlerts = void 0;
const logger_1 = require("../utils/logger");
const emailService_1 = require("../services/emailService");
const User_1 = require("../models/User");
const sentNotifications = [];
const sendDeadlineAlerts = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const { alerts } = req.body;
        if (!alerts || !Array.isArray(alerts) || alerts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No alerts provided'
            });
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (!user.preferences?.notifications) {
            return res.status(200).json({
                success: true,
                message: 'Email notifications are disabled for this user'
            });
        }
        const emailAlerts = alerts.map((alert) => ({
            title: alert.title,
            type: alert.type,
            course: alert.course,
            endTime: new Date(alert.endTime),
            description: alert.description,
            urgencyLevel: determineUrgencyLevel(new Date(alert.endTime))
        }));
        const emailSent = await emailService_1.emailService.sendDeadlineAlert(user.email, `${user.firstName} ${user.lastName}`, emailAlerts);
        if (emailSent) {
            alerts.forEach((alert) => {
                sentNotifications.push({
                    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    userId,
                    type: getNotificationType(alert.type),
                    scheduleItemId: alert.id,
                    sentAt: new Date(),
                    method: 'email',
                    status: 'sent'
                });
            });
            logger_1.logger.info(`Deadline alert email sent to user ${userId} (${user.email})`);
            return res.json({
                success: true,
                message: `Deadline alert email sent successfully to ${user.email}`,
                data: {
                    alertsSent: alerts.length,
                    email: user.email
                }
            });
        }
        else {
            return res.status(500).json({
                success: false,
                message: 'Failed to send email notification'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Send deadline alerts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send deadline alerts'
        });
    }
};
exports.sendDeadlineAlerts = sendDeadlineAlerts;
const testEmailService = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const connectionTest = await emailService_1.emailService.testConnection();
        if (!connectionTest) {
            return res.status(500).json({
                success: false,
                message: 'Email service not configured or connection failed'
            });
        }
        const testEmailSent = await emailService_1.emailService.sendEmail({
            to: user.email,
            subject: '🧪 Test Email - Unimate.AI Notifications',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
            <h1>🧪 Test Email Successful!</h1>
            <p>Hello ${user.firstName}!</p>
          </div>
          <div style="padding: 20px; background: #f8f9fa; margin: 20px 0; border-radius: 10px;">
            <h2>✅ Email Notifications Working</h2>
            <p>This test confirms that your email notifications are properly configured and working.</p>
            <p><strong>Your email:</strong> ${user.email}</p>
            <p><strong>Test time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div style="text-align: center; color: #6c757d; margin-top: 20px;">
            <p>You will now receive deadline alerts and notifications from Unimate.AI</p>
            <p><small>© ${new Date().getFullYear()} Unimate.AI. All rights reserved.</small></p>
          </div>
        </div>
      `
        });
        if (testEmailSent) {
            logger_1.logger.info(`Test email sent successfully to user ${userId} (${user.email})`);
            return res.json({
                success: true,
                message: `Test email sent successfully to ${user.email}`,
                data: {
                    email: user.email,
                    sentAt: new Date()
                }
            });
        }
        else {
            return res.status(500).json({
                success: false,
                message: 'Failed to send test email'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Test email service error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to test email service'
        });
    }
};
exports.testEmailService = testEmailService;
const getNotificationHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const userNotifications = sentNotifications.filter(notif => notif.userId === userId);
        return res.json({
            success: true,
            message: 'Notification history retrieved successfully',
            data: {
                notifications: userNotifications.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime()),
                total: userNotifications.length
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get notification history error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve notification history'
        });
    }
};
exports.getNotificationHistory = getNotificationHistory;
const updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { notifications } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const user = await User_1.User.findByIdAndUpdate(userId, { 'preferences.notifications': notifications }, { new: true });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        logger_1.logger.info(`User ${userId} updated notification preferences: ${notifications}`);
        return res.json({
            success: true,
            message: 'Notification preferences updated successfully',
            data: {
                notifications: user.preferences?.notifications
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Update notification preferences error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update notification preferences'
        });
    }
};
exports.updateNotificationPreferences = updateNotificationPreferences;
function determineUrgencyLevel(endTime) {
    const now = new Date();
    const timeDiff = endTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    if (timeDiff <= 0)
        return 'overdue';
    if (hoursDiff <= 24)
        return 'urgent';
    return 'warning';
}
function getNotificationType(scheduleType) {
    switch (scheduleType) {
        case 'assignment': return 'assignment_reminder';
        case 'exam': return 'exam_reminder';
        default: return 'deadline_alert';
    }
}
//# sourceMappingURL=notificationController.js.map