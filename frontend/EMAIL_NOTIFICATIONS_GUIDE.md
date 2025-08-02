# 📧 Email Notifications Setup Guide

## Overview
Your Unimate.AI application now supports email notifications for deadline alerts! Users will receive beautiful HTML emails when deadlines are approaching.

## 🚀 Quick Setup

### 1. Gmail Setup (Recommended)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Copy the 16-character app password

### 2. Environment Variables
Add these to your backend `.env` file:

```bash
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=noreply@unimate.ai
```

### 3. Test the Setup
1. Start your backend server
2. Login to your application
3. Go to Schedule page
4. Click "🧪 Test" button to send a test email

## 📧 Features

### Automatic Email Alerts
- **Urgent deadlines** (within 24 hours): Red alerts with animation
- **Warning deadlines** (within 3 days): Yellow warnings
- **Overdue items**: Red with pulse animation

### Manual Email Sending
- Click "📧 Email Me" button on deadline alerts
- Instant email delivery with beautiful HTML templates

### Email Content
- **Responsive HTML design** with professional styling
- **Color-coded urgency levels** (red, yellow)
- **Complete deadline information** including course, time, description
- **Quick action buttons** to open the schedule
- **Professional branding** with Unimate.AI styling

## 🎨 Email Template Features

```html
✅ Responsive design for all devices
✅ Professional gradient header
✅ Color-coded alert sections
✅ Animated overdue alerts
✅ Quick action buttons
✅ Professional footer
✅ Mobile-friendly layout
```

## 🔧 Advanced Configuration

### Other Email Services
Replace `gmail` with other services:
- `outlook` (Outlook/Hotmail)
- `yahoo` (Yahoo Mail)
- `icloud` (iCloud Mail)

### Custom SMTP
```bash
EMAIL_SERVICE=custom
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
```

## 🔒 Security Notes

⚠️ **Never use your regular email password!**
✅ Always use App Passwords for Gmail
✅ Store credentials in environment variables
✅ Add `.env` to `.gitignore`

## 🧪 Testing

### Test Email Endpoint
```bash
POST /api/notifications/test-email
Authorization: Bearer <token>
```

### Send Alert Email
```bash
POST /api/notifications/deadline-alerts
Authorization: Bearer <token>
Content-Type: application/json

{
  "alerts": [
    {
      "id": "alert1",
      "title": "Machine Learning Assignment",
      "type": "assignment",
      "course": "ML-401",
      "endTime": "2025-08-03T23:59:59Z",
      "description": "Implement neural network"
    }
  ]
}
```

## 📱 User Experience

### When Users Receive Emails
1. **Immediate notification** when deadlines approach
2. **Beautiful HTML email** with all deadline details
3. **One-click access** to schedule via buttons
4. **Mobile-responsive** design for all devices

### Notification Preferences
Users can enable/disable email notifications in their profile settings.

## 🎯 Next Steps

### Possible Enhancements
1. **SMS notifications** using Twilio
2. **Push notifications** for web browsers
3. **Slack/Discord integration**
4. **Calendar integration** (Google Calendar, Outlook)
5. **Recurring reminder schedules**

## 🐛 Troubleshooting

### Common Issues

**"Email service not configured"**
- Check environment variables are set
- Restart backend server after adding variables

**"Authentication failed"**
- Use App Password, not regular password
- Enable 2-Factor Authentication first

**"Connection refused"**
- Check internet connection
- Verify email service settings

### Debug Mode
Enable detailed logging by setting:
```bash
NODE_ENV=development
```

## 📊 Monitoring

Check backend logs for email sending status:
```bash
✅ Email sent successfully to user@example.com
❌ Failed to send email: Authentication failed
```

---

**🎉 Congratulations!** Your Unimate.AI application now has professional email notifications!
