import mongoose, { Document, Schema, Model } from 'mongoose';

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

const ReminderSchema = new Schema({
  time: {
    type: Number,
    required: true
  },
  sent: {
    type: Boolean,
    default: false
  }
});

const RecurrencePatternSchema = new Schema({
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6
  }],
  endDate: {
    type: Date
  }
});

const ScheduleSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    required: true,
    enum: ['class', 'assignment', 'exam', 'study-session', 'personal', 'meeting']
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(this: IScheduleItem, endTime: Date) {
        return endTime > this.startTime;
      },
      message: 'End time must be after start time'
    }
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  course: {
    type: String,
    trim: true,
    maxlength: 100
  },
  professor: {
    type: String,
    trim: true,
    maxlength: 100
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    required: true,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'missed'],
    default: 'scheduled'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: RecurrencePatternSchema,
    required: false
  },
  reminders: {
    type: [ReminderSchema],
    default: []
  },
  attendees: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  attachments: [{
    type: String
  }],
  color: {
    type: String,
    default: '#3B82F6',
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
ScheduleSchema.index({ createdBy: 1, startTime: 1 });
ScheduleSchema.index({ createdBy: 1, type: 1 });
ScheduleSchema.index({ createdBy: 1, status: 1 });
ScheduleSchema.index({ startTime: 1, endTime: 1 });

// Virtual for schedule status
ScheduleSchema.virtual('isDue').get(function(this: IScheduleItem) {
  const now = new Date();
  return this.type === 'assignment' && this.endTime <= now && this.status !== 'completed';
});

// Virtual for time until due
ScheduleSchema.virtual('timeUntilDue').get(function(this: IScheduleItem) {
  const now = new Date();
  return this.endTime.getTime() - now.getTime();
});

// Static method to get user's schedule
ScheduleSchema.statics.getUserSchedule = function(userId: string, startDate?: Date, endDate?: Date) {
  const query: any = { createdBy: userId };
  
  if (startDate && endDate) {
    query.$or = [
      {
        startTime: {
          $gte: startDate,
          $lte: endDate
        }
      },
      {
        endTime: {
          $gte: startDate,
          $lte: endDate
        }
      },
      {
        startTime: { $lte: startDate },
        endTime: { $gte: endDate }
      }
    ];
  }
  
  return this.find(query).sort({ startTime: 1 });
};

// Static method to get upcoming deadlines
ScheduleSchema.statics.getUpcomingDeadlines = function(userId: string, hours: number = 24) {
  const now = new Date();
  const deadline = new Date(now.getTime() + (hours * 60 * 60 * 1000));
  
  return this.find({
    createdBy: userId,
    type: { $in: ['assignment', 'exam'] },
    endTime: {
      $gte: now,
      $lte: deadline
    },
    status: { $ne: 'completed' }
  }).sort({ endTime: 1 });
};

const Schedule = mongoose.model<IScheduleItem, IScheduleModel>('Schedule', ScheduleSchema);

export default Schedule;
