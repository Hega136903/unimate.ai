import mongoose, { Document, Model } from 'mongoose';
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
declare const Notification: INotificationModel;
export default Notification;
//# sourceMappingURL=Notification.d.ts.map