import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { AIService } from '../services/aiService';
import { User } from '../models/User'; // Import the User model
import { ChatMessage } from '../models/ChatMessage';

const aiService = new AIService();

export const askAI = async (req: Request, res: Response) => {
  try {
    const { question, context } = req.body;
    const userId = (req as any).user?.id;

    if (question === 'health-check') {
      return res.json({
        success: true,
        message: 'AI service is healthy',
        data: {
          answer: 'Connection successful.',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    const aiResponse = await aiService.processQuestion({
      question,
      context,
      userId
    });

    logger.info(`AI question asked by user ${userId}: ${question}`);

    return res.json({
      success: true,
      message: 'AI response generated successfully',
      data: {
        question,
        answer: aiResponse,
        timestamp: new Date().toISOString(),
        context: context || null
      }
    });
  } catch (error) {
    logger.error('AI question error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI question'
    });
  }
};

export const getAIRecommendations = async (req: Request, res: Response) => {
  try {
  const userId = (req as any).user?.id;
  const plan = (req.body && (req.body as any).plan) ? (req.body as any).plan : undefined;

    // If user is not authenticated (shouldn't happen with route guard), return generic recs
    if (!userId) {
      const recommendations = await aiService.generateRecommendations('anonymous');
      return res.json({
        success: true,
        message: 'AI recommendations generated successfully (generic)',
        data: recommendations
      });
    }

    // Fetch user preferences from the database
    const user = await User.findById(userId);
    const userPreferences = {
      interests: user?.interests || [],
      learningStyle: user?.learningStyle || 'visual',
      department: user?.department || undefined,
      year: user?.year || undefined,
      role: user?.role || undefined,
      university: user?.university || undefined,
      plan: plan || undefined
    };

    const recommendations = await aiService.generateRecommendations(userId, userPreferences);

    logger.info(`AI recommendations generated for user ${userId}`);

    return res.json({
      success: true,
      message: 'AI recommendations generated successfully',
      data: recommendations
    });
  } catch (error) {
    logger.error('AI recommendations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI recommendations'
    });
  }
};

export const createStudySession = async (req: Request, res: Response) => {
  try {
    const { topic, duration, difficulty } = req.body;
    const userId = (req as any).user?.id;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }

    // Fetch user preferences for personalization
    let userPreferences = null;
    if (userId) {
      try {
        const user = await User.findById(userId).select('interests learningStyle');
        userPreferences = {
          interests: user?.interests || [],
          learningStyle: user?.learningStyle || 'visual'
        };
        logger.info(`Fetched user preferences for study session: ${JSON.stringify(userPreferences)}`);
      } catch (error) {
        logger.warn(`Could not fetch user preferences for ${userId}:`, error);
      }
    }

    const studySession = await aiService.createStudySession(
      topic, 
      duration || 30, 
      difficulty || 'intermediate', 
      userId,
      userPreferences
    );

    logger.info(`Personalized study session created for user ${userId}: ${topic}`);

    return res.json({
      success: true,
      message: 'Study session created successfully',
      data: studySession
    });
  } catch (error) {
    logger.error('Study session creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create study session'
    });
  }
};

export const summarizeContent = async (req: Request, res: Response) => {
  try {
    const { content, maxLength } = req.body;
    const userId = (req as any).user?.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required for summarization'
      });
    }

    const summary = await aiService.summarizeContent(content, maxLength || 200);

    logger.info(`Content summarized for user ${userId}`);

    return res.json({
      success: true,
      message: 'Content summarized successfully',
      data: { summary }
    });
  } catch (error) {
    logger.error('Content summarization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to summarize content'
    });
  }
};

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory } = req.body;
  const userId = (req as any).user?.id || (req as any).user?._id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const context = conversationHistory 
      ? conversationHistory.slice(-5).map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')
      : undefined;

    const aiResponse = await aiService.processQuestion({
      question: message,
      context,
      userId
    });

    logger.info(`AI chat message processed for user ${userId}: ${message}`);

    // Persist chat messages for this user
    if (userId) {
      try {
        await ChatMessage.create({ userId, role: 'user', content: message, provider: undefined });
        await ChatMessage.create({ userId, role: 'assistant', content: aiResponse, provider: (aiService as any).provider });
      } catch (dbErr) {
        logger.warn(`Failed to persist chat messages for user ${userId}:`, dbErr);
      }
    }

    return res.json({
      success: true,
      message: 'AI chat response generated successfully',
      data: {
        userMessage: message,
        aiResponse,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('AI chat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process chat message'
    });
  }
};

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

    const messages = history
      .slice()
      .reverse()
      .map((m: any) => ({
        id: m._id?.toString() || '',
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
