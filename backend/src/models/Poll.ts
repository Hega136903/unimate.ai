import mongoose, { Document, Schema } from 'mongoose';

export interface IPollOption {
  id: string;
  text: string;
  description?: string;
  voteCount?: number;
}

export interface IPoll extends Document {
  title: string;
  description: string;
  options: IPollOption[];
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  isAnonymous: boolean;
  category: 'student-election' | 'campus-decision' | 'feedback';
  createdBy: mongoose.Types.ObjectId;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const PollOptionSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  voteCount: {
    type: Number,
    default: 0
  }
});

const PollSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  options: {
    type: [PollOptionSchema],
    required: true,
    validate: {
      validator: function(options: IPollOption[]) {
        return options.length >= 2 && options.length <= 10;
      },
      message: 'Poll must have between 2 and 10 options'
    }
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(this: IPoll, endTime: Date) {
        return endTime > this.startTime;
      },
      message: 'End time must be after start time'
    }
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    required: true,
    enum: ['student-election', 'campus-decision', 'feedback']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalVotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
PollSchema.index({ isActive: 1, category: 1 });
PollSchema.index({ startTime: 1, endTime: 1 });
PollSchema.index({ createdBy: 1 });

// Virtual for time remaining
PollSchema.virtual('timeRemaining').get(function(this: IPoll) {
  const now = new Date();
  const endTime = this.endTime;
  return endTime.getTime() - now.getTime();
});

// Virtual for poll status
PollSchema.virtual('status').get(function(this: IPoll) {
  const now = new Date();
  if (now < this.startTime) return 'upcoming';
  if (now > this.endTime) return 'ended';
  return this.isActive ? 'active' : 'paused';
});

// Method to check if user can vote
PollSchema.methods.canUserVote = function(this: IPoll) {
  const now = new Date();
  return this.isActive && 
         now >= this.startTime && 
         now <= this.endTime;
};

// Static method to get active polls
PollSchema.statics.getActivePolls = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gt: now }
  }).sort({ createdAt: -1 });
};

const Poll = mongoose.model<IPoll>('Poll', PollSchema);

export default Poll;
