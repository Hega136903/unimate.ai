import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { emailService } from '../services/emailService';
import { scheduleEmailService } from '../services/scheduleEmailService';
import { User } from '../models/User';
import Notification, { INotification, INotificationModel } from '../models/Notification';

// Notification preferences and management using MongoDB
// All notifications are now persisted in the database

// Send deadline alerts via email
export const sendDeadlineAlerts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

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

    // Get user information
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has email notifications enabled
    if (!user.preferences?.notifications) {
      return res.status(200).json({
        success: true,
        message: 'Email notifications are disabled for this user'
      });
    }

    // Format alerts for email
    const emailAlerts = alerts.map((alert: any) => ({
      title: alert.title,
      type: alert.type,
      course: alert.course,
      endTime: new Date(alert.endTime),
      description: alert.description,
      urgencyLevel: determineUrgencyLevel(new Date(alert.endTime))
    }));

    // Send email
    const emailSent = await emailService.sendDeadlineAlert(
      user.email,
      `${user.firstName} ${user.lastName}`,
      emailAlerts
    );

    if (emailSent) {
      // Record sent notifications in database
      const notificationPromises = alerts.map((alert: any) => {
        return Notification.createNotification({
          userId: user._id as mongoose.Types.ObjectId,
          type: getNotificationType(alert.type),
          title: `Deadline Alert: ${alert.title}`,
          message: `Your ${alert.type} "${alert.title}" is due soon`,
          scheduleItemId: alert.id,
          method: 'email',
          status: 'sent',
          sentAt: new Date(),
          metadata: {
            emailAddress: user.email,
            urgencyLevel: alert.urgencyLevel || 'medium'
          }
        });
      });

      await Promise.all(notificationPromises);

      logger.info(`Deadline alert email sent to user ${userId} (${user.email})`);

      return res.json({
        success: true,
        message: `Deadline alert email sent successfully to ${user.email}`,
        data: {
          alertsSent: alerts.length,
          email: user.email
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send email notification'
      });
    }
  } catch (error) {
    logger.error('Send deadline alerts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send deadline alerts'
    });
  }
};

// Test email configuration
export const testEmailService = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Test connection
    const connectionTest = await emailService.testConnection();
    if (!connectionTest) {
      return res.status(500).json({
        success: false,
        message: 'Email service not configured or connection failed'
      });
    }

    // Send test email to the student's login email
    const testEmailSent = await emailService.sendEmail({
      to: user.email, // This will be the student's login email (221501044@rajalakshmi.edu.in)
      subject: '🧪 Test Email - Unimate.AI Notifications',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
            <h1>🧪 Test Email Successful!</h1>
            <p>Hello ${user.firstName}!</p>
          </div>
          <div style="padding: 20px; background: #f8f9fa; margin: 20px 0; border-radius: 10px;">
            <h2>✅ Email Notifications Working</h2>
            <p>This test confirms that email notifications are working for your account.</p>
            <p><strong>Your login email:</strong> ${user.email}</p>
            <p><strong>Your student ID:</strong> ${user.studentId || 'Not set'}</p>
            <p><strong>Test time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div style="padding: 20px; background: #e3f2fd; margin: 20px 0; border-radius: 10px;">
            <h3>📧 How Email Alerts Work:</h3>
            <ul>
              <li>✅ <strong>Automatic alerts</strong> when deadlines are within 24 hours</li>
              <li>✅ <strong>Sent to your login email:</strong> ${user.email}</li>
              <li>✅ <strong>Beautiful HTML format</strong> with color-coded urgency</li>
              <li>✅ <strong>Mobile-friendly</strong> design</li>
            </ul>
          </div>
          <div style="text-align: center; color: #6c757d; margin-top: 20px;">
            <p>You will now receive deadline alerts and notifications from Unimate.AI</p>
            <p><small>© ${new Date().getFullYear()} Unimate.AI. All rights reserved.</small></p>
          </div>
        </div>
      `
    });

    if (testEmailSent) {
      logger.info(`Test email sent successfully to user ${userId} (${user.email})`);
      return res.json({
        success: true,
        message: `Test email sent successfully to your login email: ${user.email}`,
        data: {
          email: user.email,
          sentAt: new Date(),
          isConfigured: emailService.testConnection !== undefined
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email'
      });
    }
  } catch (error) {
    logger.error('Test email service error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to test email service'
    });
  }
};

// Get notification history
export const getNotificationHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const userNotifications = await Notification.getUserNotifications(userId, 50);
    
    return res.json({
      success: true,
      message: 'Notification history retrieved successfully',
      data: {
        notifications: userNotifications,
        total: userNotifications.length
      }
    });
  } catch (error) {
    logger.error('Get notification history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification history'
    });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { notifications } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 'preferences.notifications': notifications },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info(`User ${userId} updated notification preferences: ${notifications}`);

    return res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        notifications: user.preferences?.notifications
      }
    });
  } catch (error) {
    logger.error('Update notification preferences error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences'
    });
  }
};

// Helper functions
function determineUrgencyLevel(endTime: Date): 'urgent' | 'warning' | 'overdue' {
  const now = new Date();
  const timeDiff = endTime.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 3600);

  if (timeDiff <= 0) return 'overdue';
  if (hoursDiff <= 24) return 'urgent';
  return 'warning';
}

function getNotificationType(scheduleType: string): 'deadline_alert' | 'assignment_reminder' | 'exam_reminder' {
  switch (scheduleType) {
    case 'assignment': return 'assignment_reminder';
    case 'exam': return 'exam_reminder';
    default: return 'deadline_alert';
  }
}

// Trigger automatic email check for all users
export const triggerAutomaticEmailCheck = async (req: Request, res: Response) => {
  try {
    logger.info('🔧 Manual trigger for automatic email check requested');
    
    // Trigger the automatic email check
    await scheduleEmailService.triggerManualCheck();
    
    return res.json({
      success: true,
      message: 'Automatic email check triggered successfully',
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Trigger automatic email check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to trigger automatic email check'
    });
  }
};

// Get unread notifications count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const unreadCount = await Notification.getUnreadCount(userId);

    return res.json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    logger.error('Get unread count error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

// Mark notifications as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { notificationIds } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'Notification IDs are required'
      });
    }

    await Notification.markAsRead(userId, notificationIds);

    return res.json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    logger.error('Mark as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
};
