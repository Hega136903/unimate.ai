import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChatMessage extends Document {
  userId: Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  provider?: 'google' | 'openai' | 'fallback';
  sessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    provider: { type: String, enum: ['google', 'openai', 'fallback'], default: undefined },
    sessionId: { type: String, default: undefined },
  },
  { timestamps: true }
);

// Compound index for efficient user history queries
ChatMessageSchema.index({ userId: 1, createdAt: -1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
