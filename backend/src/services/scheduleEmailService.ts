import cron from 'node-cron';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { emailService } from './emailService';

interface ScheduleItem {
  _id: string;
  title: string;
  type: string;
  course?: string;
  endTime: Date;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface DeadlineAlert {
  title: string;
  type: string;
  course?: string;
  endTime: Date;
  description?: string;
  urgencyLevel: 'urgent' | 'warning' | 'overdue';
}

class ScheduleEmailService {
  private isRunning: boolean = false;

  constructor() {
    this.startScheduler();
  }

  // Start the automatic email scheduler
  startScheduler() {
    // Run every hour at minute 0 (e.g., 9:00 AM, 10:00 AM, etc.)
    cron.schedule('0 * * * *', async () => {
      if (this.isRunning) {
        logger.info('⏳ Previous email check still running, skipping...');
        return;
      }

      logger.info('🔄 Starting automatic deadline email check for all users...');
      await this.checkAllUsersDeadlines();
    });

    // Also run every day at 8:00 AM for daily summary
    cron.schedule('0 8 * * *', async () => {
      logger.info('🌅 Running daily deadline summary email check...');
      await this.sendDailySummary();
    });

    logger.info('📅 Automatic email scheduler started:');
    logger.info('   • Hourly checks: Every hour at :00');
    logger.info('   • Daily summary: Every day at 8:00 AM');
  }

  // Check deadlines for ALL users and send emails automatically
  async checkAllUsersDeadlines() {
    this.isRunning = true;
    
    try {
      // Get all active users from database
      const users = await User.find({ 
        isActive: true,
        'preferences.notifications': true // Only users who want notifications
      });

      logger.info(`📧 Checking deadlines for ${users.length} users...`);

      let totalEmailsSent = 0;

      for (const user of users) {
        try {
          // Get user's schedule items (you'll need to implement this based on your schedule storage)
          const userSchedule = await this.getUserScheduleItems((user._id as any).toString());
          
          if (!userSchedule || userSchedule.length === 0) {
            continue; // Skip users with no schedule items
          }

          // Check for urgent deadlines
          const urgentAlerts = this.findUrgentDeadlines(userSchedule);
          
          if (urgentAlerts.length > 0) {
            // Send email to user's login email
            const emailSent = await emailService.sendDeadlineAlert(
              user.email, // Their login email
              `${user.firstName} ${user.lastName}`,
              urgentAlerts
            );

            if (emailSent) {
              totalEmailsSent++;
              logger.info(`📧 Automatic email sent to ${user.email} (${urgentAlerts.length} urgent deadlines)`);
            }
          }

        } catch (userError) {
          logger.error(`Error processing user ${user.email}:`, userError);
        }
      }

      logger.info(`✅ Automatic deadline check complete. Emails sent: ${totalEmailsSent}/${users.length} users`);
      
    } catch (error) {
      logger.error('❌ Error in automatic deadline check:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Send daily summary emails
  async sendDailySummary() {
    try {
      const users = await User.find({ 
        isActive: true,
        'preferences.notifications': true 
      });

      logger.info(`📊 Sending daily summary to ${users.length} users...`);

      for (const user of users) {
        const userSchedule = await this.getUserScheduleItems((user._id as any).toString());
        const todayDeadlines = this.getTodayDeadlines(userSchedule);
        const weekDeadlines = this.getWeekDeadlines(userSchedule);

        if (todayDeadlines.length > 0 || weekDeadlines.length > 0) {
          await this.sendDailySummaryEmail(user, todayDeadlines, weekDeadlines);
        }
      }

    } catch (error) {
      logger.error('❌ Error in daily summary:', error);
    }
  }

  // Get user's schedule items (implement based on your data structure)
  private async getUserScheduleItems(userId: string): Promise<ScheduleItem[]> {
    try {
      // Import the schedules array from controller
      const { schedules } = await import('../controllers/scheduleController');
      
      // Filter by user ID to get individual schedules
      const userSchedule = schedules.filter(item => item.createdBy === userId);
      
      // Convert to the format expected by email service
      return userSchedule.map(item => ({
        _id: item.id,
        title: item.title,
        type: item.type,
        course: item.course,
        endTime: item.endTime,
        description: item.description,
        priority: item.priority
      }));
    } catch (error) {
      logger.error('Error getting user schedule items:', error);
      return [];
    }
  }

  // Find deadlines that need urgent email alerts
  private findUrgentDeadlines(scheduleItems: ScheduleItem[]): DeadlineAlert[] {
    const now = new Date();
    const alerts: DeadlineAlert[] = [];

    for (const item of scheduleItems) {
      const timeDiff = item.endTime.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);

      let urgencyLevel: 'urgent' | 'warning' | 'overdue';
      
      if (timeDiff <= 0) {
        urgencyLevel = 'overdue';
      } else if (hoursDiff <= 24) {
        urgencyLevel = 'urgent';
      } else if (hoursDiff <= 72) { // 3 days
        urgencyLevel = 'warning';
      } else {
        continue; // Not urgent enough for email
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

  // Get deadlines for today
  private getTodayDeadlines(scheduleItems: ScheduleItem[]): ScheduleItem[] {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return scheduleItems.filter(item => {
      return item.endTime >= today && item.endTime < tomorrow;
    });
  }

  // Get deadlines for this week
  private getWeekDeadlines(scheduleItems: ScheduleItem[]): ScheduleItem[] {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return scheduleItems.filter(item => {
      return item.endTime >= today && item.endTime < nextWeek;
    });
  }

  // Send daily summary email
  private async sendDailySummaryEmail(user: any, todayDeadlines: ScheduleItem[], weekDeadlines: ScheduleItem[]) {
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

    await emailService.sendEmail({
      to: user.email,
      subject,
      html
    });

    logger.info(`📊 Daily summary sent to ${user.email}`);
  }

  // Manual trigger for testing
  async triggerManualCheck() {
    logger.info('🔧 Manual deadline check triggered');
    await this.checkAllUsersDeadlines();
  }

  // Stop the scheduler
  stopScheduler() {
    // Note: node-cron doesn't provide a direct way to stop specific tasks
    // In production, you'd want to store task references
    logger.info('⏹️ Email scheduler stopped');
  }
}

export const scheduleEmailService = new ScheduleEmailService();
export default ScheduleEmailService;
