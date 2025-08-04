"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleEmailService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const emailService_1 = require("./emailService");
class ScheduleEmailService {
    constructor() {
        this.isRunning = false;
        this.startScheduler();
    }
    startScheduler() {
        node_cron_1.default.schedule('0 * * * *', async () => {
            if (this.isRunning) {
                logger_1.logger.info('⏳ Previous email check still running, skipping...');
                return;
            }
            logger_1.logger.info('🔄 Starting automatic deadline email check for all users...');
            await this.checkAllUsersDeadlines();
        });
        node_cron_1.default.schedule('0 8 * * *', async () => {
            logger_1.logger.info('🌅 Running daily deadline summary email check...');
            await this.sendDailySummary();
        });
        logger_1.logger.info('📅 Automatic email scheduler started:');
        logger_1.logger.info('   • Hourly checks: Every hour at :00');
        logger_1.logger.info('   • Daily summary: Every day at 8:00 AM');
    }
    async checkAllUsersDeadlines() {
        this.isRunning = true;
        try {
            const users = await User_1.User.find({
                isActive: true,
                'preferences.notifications': true
            });
            logger_1.logger.info(`📧 Checking deadlines for ${users.length} users...`);
            let totalEmailsSent = 0;
            for (const user of users) {
                try {
                    const userSchedule = await this.getUserScheduleItems(user._id.toString());
                    if (!userSchedule || userSchedule.length === 0) {
                        continue;
                    }
                    const urgentAlerts = this.findUrgentDeadlines(userSchedule);
                    if (urgentAlerts.length > 0) {
                        const emailSent = await emailService_1.emailService.sendDeadlineAlert(user.email, `${user.firstName} ${user.lastName}`, urgentAlerts);
                        if (emailSent) {
                            totalEmailsSent++;
                            logger_1.logger.info(`📧 Automatic email sent to ${user.email} (${urgentAlerts.length} urgent deadlines)`);
                        }
                    }
                }
                catch (userError) {
                    logger_1.logger.error(`Error processing user ${user.email}:`, userError);
                }
            }
            logger_1.logger.info(`✅ Automatic deadline check complete. Emails sent: ${totalEmailsSent}/${users.length} users`);
        }
        catch (error) {
            logger_1.logger.error('❌ Error in automatic deadline check:', error);
        }
        finally {
            this.isRunning = false;
        }
    }
    async sendDailySummary() {
        try {
            const users = await User_1.User.find({
                isActive: true,
                'preferences.notifications': true
            });
            logger_1.logger.info(`📊 Sending daily summary to ${users.length} users...`);
            for (const user of users) {
                const userSchedule = await this.getUserScheduleItems(user._id.toString());
                const todayDeadlines = this.getTodayDeadlines(userSchedule);
                const weekDeadlines = this.getWeekDeadlines(userSchedule);
                if (todayDeadlines.length > 0 || weekDeadlines.length > 0) {
                    await this.sendDailySummaryEmail(user, todayDeadlines, weekDeadlines);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Error in daily summary:', error);
        }
    }
    async getUserScheduleItems(userId) {
        try {
            const Schedule = (await Promise.resolve().then(() => __importStar(require('../models/Schedule')))).default;
            const userSchedule = await Schedule.find({ createdBy: userId });
            return userSchedule.map(item => ({
                _id: item._id.toString(),
                title: item.title,
                type: item.type,
                course: item.course,
                endTime: item.endTime,
                description: item.description,
                priority: item.priority
            }));
        }
        catch (error) {
            logger_1.logger.error('Error getting user schedule items:', error);
            return [];
        }
    }
    findUrgentDeadlines(scheduleItems) {
        const now = new Date();
        const alerts = [];
        for (const item of scheduleItems) {
            const timeDiff = item.endTime.getTime() - now.getTime();
            const hoursDiff = timeDiff / (1000 * 3600);
            let urgencyLevel;
            if (timeDiff <= 0) {
                urgencyLevel = 'overdue';
            }
            else if (hoursDiff <= 24) {
                urgencyLevel = 'urgent';
            }
            else if (hoursDiff <= 72) {
                urgencyLevel = 'warning';
            }
            else {
                continue;
            }
            alerts.push({
                title: item.title,
                type: item.type,
                course: item.course,
                endTime: item.endTime,
                description: item.description,
                urgencyLevel
            });
        }
        return alerts;
    }
    getTodayDeadlines(scheduleItems) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return scheduleItems.filter(item => {
            return item.endTime >= today && item.endTime < tomorrow;
        });
    }
    getWeekDeadlines(scheduleItems) {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return scheduleItems.filter(item => {
            return item.endTime >= today && item.endTime < nextWeek;
        });
    }
    async sendDailySummaryEmail(user, todayDeadlines, weekDeadlines) {
        const subject = `📅 Daily Schedule Summary - ${todayDeadlines.length} due today`;
        const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .deadline-item { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .urgent { border-left-color: #dc3545; background: #f8d7da; }
            .today { border-left-color: #28a745; background: #d4edda; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📅 Daily Schedule Summary</h1>
                <p>Good morning, ${user.firstName}!</p>
                <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div class="content">
                ${todayDeadlines.length > 0 ? `
                <h2>🎯 Due Today (${todayDeadlines.length})</h2>
                ${todayDeadlines.map(item => `
                <div class="deadline-item today">
                    <strong>${item.title}</strong><br>
                    ${item.course ? `<small>${item.course}</small><br>` : ''}
                    <small>Due: ${item.endTime.toLocaleString()}</small>
                </div>
                `).join('')}
                ` : '<h2>🎉 No deadlines today!</h2>'}

                ${weekDeadlines.length > 0 ? `
                <h2>📋 This Week (${weekDeadlines.length})</h2>
                ${weekDeadlines.map(item => `
                <div class="deadline-item">
                    <strong>${item.title}</strong><br>
                    ${item.course ? `<small>${item.course}</small><br>` : ''}
                    <small>Due: ${item.endTime.toLocaleString()}</small>
                </div>
                `).join('')}
                ` : ''}

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'https://unimate-ai-37d2.vercel.app'}" 
                       style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                       📅 Open Unimate.AI
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
        await emailService_1.emailService.sendEmail({
            to: user.email,
            subject,
            html
        });
        logger_1.logger.info(`📊 Daily summary sent to ${user.email}`);
    }
    async triggerManualCheck() {
        logger_1.logger.info('🔧 Manual deadline check triggered');
        await this.checkAllUsersDeadlines();
    }
    stopScheduler() {
        logger_1.logger.info('⏹️ Email scheduler stopped');
    }
}
exports.scheduleEmailService = new ScheduleEmailService();
exports.default = ScheduleEmailService;
//# sourceMappingURL=scheduleEmailService.js.map