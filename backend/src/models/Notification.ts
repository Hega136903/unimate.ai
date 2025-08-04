import mongoose, { Document, Schema, Model } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'deadline_alert' | 'assignment_reminder' | 'exam_reminder' | 'poll_alert' | 'general';
  title: string;
  message: string;
  scheduleItemId?: mongoose.Types.ObjectId;
  pollId?: mongoose.Types.ObjectId;
  method: 'email' | 'push' | 'sms' | 'in_app';
  status: 'sent' | 'failed' | 'pending' | 'read' | 'unread';
  sentAt?: Date;
  readAt?: Date;
  metadata?: {
    emailAddress?: string;
    urgencyLevel?: 'low' | 'medium' | 'high' | 'urgent';
    reminderTime?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationModel extends Model<INotification> {
  getUserNotifications(userId: string, limit?: number): Promise<INotification[]>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(userId: string, notificationIds: string[]): Promise<any>;
  createNotification(data: Partial<INotification>): Promise<INotification>;
}

const NotificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['deadline_alert', 'assignment_reminder', 'exam_reminder', 'poll_alert', 'general']
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  scheduleItemId: {
    type: Schema.Types.ObjectId,
    ref: 'Schedule',
    required: false
  },
  pollId: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: false
  },
  method: {
    type: String,
    required: true,
    enum: ['email', 'push', 'sms', 'in_app'],
    default: 'in_app'
  },
  status: {
    type: String,
    required: true,
    enum: ['sent', 'failed', 'pending', 'read', 'unread'],
    default: 'pending'
  },
  sentAt: {
    type: Date,
    required: false
  },
  readAt: {
    type: Date,
    required: false
  },
  metadata: {
    emailAddress: {
      type: String,
      trim: true
    },
    urgencyLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    reminderTime: {
      type: Number // minutes before event
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ userId: 1, type: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, method: 1 });

// Virtual for notification age
NotificationSchema.virtual('isRecent').get(function(this: INotification) {
  const now = new Date();
  const hoursDiff = (now.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60);
  return hoursDiff <= 24; // Consider recent if within 24 hours
});

// Static method to get user's notifications
NotificationSchema.statics.getUserNotifications = function(userId: string, limit: number = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('scheduleItemId', 'title type endTime')
    .populate('pollId', 'title endTime');
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({ 
    userId, 
    status: { $in: ['unread', 'sent'] }
  });
};

// Static method to mark notifications as read
NotificationSchema.statics.markAsRead = function(userId: string, notificationIds: string[]) {
  return this.updateMany(
    { 
      _id: { $in: notificationIds },
      userId 
    },
    { 
      status: 'read',
      readAt: new Date()
    }
  );
};

// Static method to create notification
NotificationSchema.statics.createNotification = function(data: Partial<INotification>) {
  return this.create({
    ...data,
    status: data.status || 'unread'
  });
};

const Notification = mongoose.model<INotification, INotificationModel>('Notification', NotificationSchema);

export default Notification;
