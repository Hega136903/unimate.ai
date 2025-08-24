import { Request, Response } from 'express';
import { ChatMessage } from '../models/ChatMessage';
import { logger } from '../utils/logger';

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    const limitParam = (req.query.limit as string) || '50';
    const before = req.query.before as string | undefined;
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const filter: any = { userId };
    if (before) {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        filter.createdAt = { $lt: beforeDate };
      }
    }

    const history = await ChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Return in chronological order
    const messages = history
      .slice()
      .reverse()
      .map((m) => ({
        id: (m as any)._id?.toString() || '',
        role: m.role,
        content: m.content,
        timestamp: m.createdAt,
      }));

    return res.json({ success: true, message: 'Chat history fetched', data: { messages } });
  } catch (error) {
    logger.error('Failed to fetch chat history:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
  }
};

export const clearChatHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await ChatMessage.deleteMany({ userId });
    logger.info(`Cleared chat history for user ${userId}. Deleted: ${result.deletedCount}`);
    return res.json({ success: true, message: 'Chat history cleared', data: { deleted: result.deletedCount } });
  } catch (error) {
    logger.error('Failed to clear chat history:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear chat history' });
  }
};
