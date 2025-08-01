import mongoose, { Document, Schema } from 'mongoose';

export interface IVote extends Document {
  pollId: mongoose.Types.ObjectId;
  optionId: string;
  userId?: mongoose.Types.ObjectId; // Optional for anonymous votes
  userFingerprint?: string; // For anonymous vote tracking
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const VoteSchema = new Schema({
  pollId: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: true
  },
  optionId: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Not required for anonymous votes
  },
  userFingerprint: {
    type: String,
    required: false // For anonymous vote tracking
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries and uniqueness
VoteSchema.index({ pollId: 1, userId: 1 }, { 
  unique: true, 
  sparse: true,
  name: 'unique_user_vote'
});

VoteSchema.index({ pollId: 1, userFingerprint: 1 }, { 
  unique: true, 
  sparse: true,
  name: 'unique_anonymous_vote'
});

VoteSchema.index({ pollId: 1 });
VoteSchema.index({ createdAt: -1 });

// Static method to check if user has voted
VoteSchema.statics.hasUserVoted = function(pollId: string, userId?: string, userFingerprint?: string) {
  const query: any = { pollId };
  
  if (userId) {
    query.userId = userId;
  } else if (userFingerprint) {
    query.userFingerprint = userFingerprint;
  } else {
    return Promise.resolve(false);
  }
  
  return this.findOne(query).then((vote: IVote | null) => !!vote);
};

// Static method to get vote counts for a poll
VoteSchema.statics.getVoteCounts = function(pollId: string) {
  return this.aggregate([
    { $match: { pollId: new mongoose.Types.ObjectId(pollId) } },
    { $group: { _id: '$optionId', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get voting timeline
VoteSchema.statics.getVotingTimeline = function(pollId: string) {
  return this.find({ pollId })
    .select('optionId createdAt')
    .sort({ createdAt: 1 });
};

const Vote = mongoose.model<IVote>('Vote', VoteSchema);

export default Vote;
