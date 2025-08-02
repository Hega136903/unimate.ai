import mongoose, { Document, Schema } from 'mongoose';

export interface IVote extends Document {
  voterId: string;
  pollId: string;
  optionId: string;
  timestamp: Date;
  isAnonymous: boolean;
  ipAddress?: string;
}

const VoteSchema: Schema = new Schema({
  voterId: {
    type: String,
    required: true,
    index: true
  },
  pollId: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: true,
    index: true
  },
  optionId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  ipAddress: {
    type: String,
    required: false
  }
});

// Compound index to prevent duplicate votes
VoteSchema.index({ voterId: 1, pollId: 1 }, { unique: true, name: 'voterId_pollId_unique' });

export default mongoose.model<IVote>('Vote', VoteSchema);