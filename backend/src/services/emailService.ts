import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface DeadlineAlert {
  title: string;
  type: string;
  course?: string;
  endTime: Date;
  description?: string;
  urgencyLevel: 'urgent' | 'warning' | 'overdue';
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    // Don't initialize immediately - wait for environment to be loaded
  }

  // Public method to initialize the service
  public initialize() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Check if email configuration is available
      const emailUser = process.env.EMAIL_USER;
      const emailPassword = process.env.EMAIL_PASSWORD;
      const emailService = process.env.EMAIL_SERVICE || 'gmail';

      logger.info(`📧 Email config check: User=${emailUser}, Password=${emailPassword ? '[SET]' : '[NOT SET]'}, Service=${emailService}`);

      if (!emailUser || !emailPassword || emailUser === 'your-email@gmail.com' || emailPassword === 'paste-your-16-character-app-password-here' || emailPassword === 'your-16-character-gmail-app-password-here') {
        logger.warn('Email configuration not found or using example values. Email notifications will use mock mode.');
        this.isConfigured = false; // Set to false for mock mode
        return;
      }

      this.transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      this.isConfigured = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      // Mock mode - log email instead of sending
      logger.info('📧 [MOCK EMAIL] Would send email:', {
        to: options.to,
        subject: options.subject,
        htmlLength: options.html.length
      });
      logger.info('📧 [MOCK EMAIL] Email content preview:', options.html.substring(0, 200) + '...');
      return true; // Return true for mock success
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}`, { messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendDeadlineAlert(userEmail: string, userName: string, alerts: DeadlineAlert[]): Promise<boolean> {
    const urgentAlerts = alerts.filter(alert => alert.urgencyLevel === 'urgent');
    const warningAlerts = alerts.filter(alert => alert.urgencyLevel === 'warning');
    const overdueAlerts = alerts.filter(alert => alert.urgencyLevel === 'overdue');

    const subject = this.generateSubject(urgentAlerts.length, warningAlerts.length, overdueAlerts.length);
    const html = this.generateDeadlineEmailHTML(userName, alerts);

    return this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }

  private generateSubject(urgentCount: number, warningCount: number, overdueCount: number): string {
    if (overdueCount > 0) {
      return `🚨 OVERDUE: ${overdueCount} deadline(s) have passed - Unimate.AI`;
    } else if (urgentCount > 0) {
      return `⚠️ URGENT: ${urgentCount} deadline(s) within 24 hours - Unimate.AI`;
    } else if (warningCount > 0) {
      return `📅 Reminder: ${warningCount} upcoming deadline(s) - Unimate.AI`;
    }
    return '📅 Deadline Reminder - Unimate.AI';
  }

  private generateDeadlineEmailHTML(userName: string, alerts: DeadlineAlert[]): string {
    const urgentAlerts = alerts.filter(alert => alert.urgencyLevel === 'urgent');
    const warningAlerts = alerts.filter(alert => alert.urgencyLevel === 'warning');
    const overdueAlerts = alerts.filter(alert => alert.urgencyLevel === 'overdue');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deadline Alert - Unimate.AI</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
            .alert-section { margin: 20px 0; }
            .alert-item { background: #f8f9fa; border-left: 4px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .urgent { border-left-color: #dc3545; background: #f8d7da; }
            .warning { border-left-color: #ffc107; background: #fff3cd; }
            .overdue { border-left-color: #dc3545; background: #f8d7da; animation: pulse 2s infinite; }
            .alert-title { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
            .alert-course { color: #6c757d; font-size: 14px; margin-bottom: 5px; }
            .alert-time { color: #dc3545; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #6c757d; }
            .btn { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📅 Deadline Alert</h1>
                <p>Hello ${userName}!</p>
            </div>
            
            ${overdueAlerts.length > 0 ? `
            <div class="alert-section">
                <h2 style="color: #dc3545;">🚨 OVERDUE (${overdueAlerts.length})</h2>
                ${overdueAlerts.map(alert => `
                <div class="alert-item overdue">
                    <div class="alert-title">${alert.title}</div>
                    ${alert.course ? `<div class="alert-course">${alert.course}</div>` : ''}
                    <div class="alert-time">Was due: ${this.formatDate(alert.endTime)}</div>
                    ${alert.description ? `<p>${alert.description}</p>` : ''}
                </div>
                `).join('')}
            </div>
            ` : ''}

            ${urgentAlerts.length > 0 ? `
            <div class="alert-section">
                <h2 style="color: #dc3545;">⚠️ URGENT - Within 24 Hours (${urgentAlerts.length})</h2>
                ${urgentAlerts.map(alert => `
                <div class="alert-item urgent">
                    <div class="alert-title">${alert.title}</div>
                    ${alert.course ? `<div class="alert-course">${alert.course}</div>` : ''}
                    <div class="alert-time">Due: ${this.formatDate(alert.endTime)}</div>
                    ${alert.description ? `<p>${alert.description}</p>` : ''}
                </div>
                `).join('')}
            </div>
            ` : ''}

            ${warningAlerts.length > 0 ? `
            <div class="alert-section">
                <h2 style="color: #ffc107;">📅 Upcoming - Within 3 Days (${warningAlerts.length})</h2>
                ${warningAlerts.map(alert => `
                <div class="alert-item warning">
                    <div class="alert-title">${alert.title}</div>
                    ${alert.course ? `<div class="alert-course">${alert.course}</div>` : ''}
                    <div class="alert-time">Due: ${this.formatDate(alert.endTime)}</div>
                    ${alert.description ? `<p>${alert.description}</p>` : ''}
                </div>
                `).join('')}
            </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/schedule" class="btn">
                    📅 View Full Schedule
                </a>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">
                    🎓 Open Unimate.AI
                </a>
            </div>

            <div class="footer">
                <p>This is an automated reminder from Unimate.AI</p>
                <p>Stay organized and never miss a deadline! 🎯</p>
                <p><small>© ${new Date().getFullYear()} Unimate.AI. All rights reserved.</small></p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      logger.info('📧 [MOCK MODE] Email service in mock mode - would verify connection');
      return true; // Return true for mock mode
    }

    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default EmailService;
