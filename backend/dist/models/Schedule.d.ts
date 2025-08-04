import mongoose, { Document, Model } from 'mongoose';
export interface IScheduleItem extends Document {
    title: string;
    description?: string;
    type: 'class' | 'assignment' | 'exam' | 'study-session' | 'personal' | 'meeting';
    startTime: Date;
    endTime: Date;
    location?: string;
    course?: string;
    professor?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'missed';
    isRecurring: boolean;
    recurrencePattern?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        daysOfWeek?: number[];
        endDate?: Date;
    };
    reminders: {
        time: number;
        sent: boolean;
    }[];
    attendees?: string[];
    notes?: string;
    attachments?: string[];
    color?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export interface IScheduleModel extends Model<IScheduleItem> {
    getUserSchedule(userId: string, startDate?: Date, endDate?: Date): Promise<IScheduleItem[]>;
    getUpcomingDeadlines(userId: string, hours?: number): Promise<IScheduleItem[]>;
}
declare const Schedule: IScheduleModel;
export default Schedule;
//# sourceMappingURL=Schedule.d.ts.map