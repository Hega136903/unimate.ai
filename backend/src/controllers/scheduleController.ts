import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import Schedule, { IScheduleItem, IScheduleModel } from '../models/Schedule';

// Interfaces for schedule management
interface StudySession {
  id: string;
  subject: string;
  topic: string;
  duration: number; // minutes
  scheduledTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  productivity: number; // 1-10 scale
  notes?: string;
  goals: string[];
  completed: boolean;
  studentId: string;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Get student schedule
export const getStudentSchedule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, type } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    console.log('📅 Getting schedule for user:', userId);
    
    // Build query
    const query: any = { createdBy: userId };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      query.$or = [
        {
          startTime: {
            $gte: start,
            $lte: end
          }
        },
        {
          endTime: {
            $gte: start,
            $lte: end
          }
        },
        {
          startTime: { $lte: start },
          endTime: { $gte: end }
        }
      ];
    }

    const scheduleItems = await Schedule.find(query).sort({ startTime: 1 });
    
    console.log(`📅 Found ${scheduleItems.length} schedule items`);

    // Transform for frontend
    const transformedItems = scheduleItems.map(item => ({
      id: (item._id as any).toString(),
      title: item.title,
      description: item.description,
      type: item.type,
      startTime: item.startTime.toISOString(),
      endTime: item.endTime.toISOString(),
      location: item.location,
      course: item.course,
      professor: item.professor,
      priority: item.priority,
      status: item.status,
      color: item.color || '#3B82F6',
      isRecurring: item.isRecurring,
      recurrencePattern: item.recurrencePattern,
      reminders: item.reminders,
      notes: item.notes
    }));

    return res.json({
      success: true,
      message: 'Schedule retrieved successfully',
      data: transformedItems
    });

  } catch (error) {
    logger.error('Error getting student schedule:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve schedule'
    });
  }
};

// Create schedule item
export const createScheduleItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const {
      title,
      description,
      type,
      startTime,
      endTime,
      location,
      course,
      professor,
      priority = 'medium',
      color = '#3B82F6',
      isRecurring = false,
      recurrencePattern,
      reminders = []
    } = req.body;

    // Validate required fields
    if (!title || !type || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Title, type, start time, and end time are required'
      });
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    const scheduleItem = new Schedule({
      title,
      description,
      type,
      startTime: start,
      endTime: end,
      location,
      course,
      professor,
      priority,
      status: 'scheduled',
      color,
      isRecurring,
      recurrencePattern,
      reminders,
      createdBy: userId
    });

    await scheduleItem.save();

    console.log('📅 Created schedule item:', title);

    return res.status(201).json({
      success: true,
      message: 'Schedule item created successfully',
      data: {
        id: (scheduleItem._id as any).toString(),
        title: scheduleItem.title,
        description: scheduleItem.description,
        type: scheduleItem.type,
        startTime: scheduleItem.startTime.toISOString(),
        endTime: scheduleItem.endTime.toISOString(),
        location: scheduleItem.location,
        course: scheduleItem.course,
        professor: scheduleItem.professor,
        priority: scheduleItem.priority,
        status: scheduleItem.status,
        color: scheduleItem.color
      }
    });

  } catch (error) {
    logger.error('Error creating schedule item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create schedule item'
    });
  }
};

// Update schedule item
export const updateScheduleItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { itemId } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find the schedule item
    const scheduleItem = await Schedule.findOne({
      _id: itemId,
      createdBy: userId
    });

    if (!scheduleItem) {
      return res.status(404).json({
        success: false,
        message: 'Schedule item not found'
      });
    }

    // Update fields
    const updateData = { ...req.body };
    delete updateData.createdBy; // Don't allow changing owner

    // Validate dates if provided
    if (updateData.startTime && updateData.endTime) {
      const start = new Date(updateData.startTime);
      const end = new Date(updateData.endTime);
      
      if (end <= start) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }
    }

    const updatedItem = await Schedule.findByIdAndUpdate(
      itemId,
      updateData,
      { new: true }
    );

    console.log('📅 Updated schedule item:', updatedItem?.title);

    return res.json({
      success: true,
      message: 'Schedule item updated successfully',
      data: {
        id: (updatedItem?._id as any)?.toString(),
        title: updatedItem?.title,
        description: updatedItem?.description,
        type: updatedItem?.type,
        startTime: updatedItem?.startTime.toISOString(),
        endTime: updatedItem?.endTime.toISOString(),
        location: updatedItem?.location,
        course: updatedItem?.course,
        professor: updatedItem?.professor,
        priority: updatedItem?.priority,
        status: updatedItem?.status,
        color: updatedItem?.color
      }
    });

  } catch (error) {
    logger.error('Error updating schedule item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update schedule item'
    });
  }
};

// Delete schedule item
export const deleteScheduleItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { itemId } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const result = await Schedule.findOneAndDelete({
      _id: itemId,
      createdBy: userId
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Schedule item not found'
      });
    }

    console.log('📅 Deleted schedule item:', result.title);

    return res.json({
      success: true,
      message: 'Schedule item deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting schedule item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete schedule item'
    });
  }
};

// Get upcoming deadlines
export const getUpcomingDeadlines = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { hours = 24 } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const deadlines = await Schedule.getUpcomingDeadlines(userId, Number(hours));
    
    const transformedDeadlines = deadlines.map((item: any) => ({
      id: (item._id as any).toString(),
      title: item.title,
      description: item.description,
      type: item.type,
      startTime: item.startTime.toISOString(),
      endTime: item.endTime.toISOString(),
      course: item.course,
      professor: item.professor,
      priority: item.priority,
      timeRemaining: item.endTime.getTime() - Date.now()
    }));

    return res.json({
      success: true,
      message: 'Upcoming deadlines retrieved successfully',
      data: transformedDeadlines
    });

  } catch (error) {
    logger.error('Error getting upcoming deadlines:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve deadlines'
    });
  }
};

// Get AI suggestions
export const getAISuggestions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get user's schedule for analysis
    const scheduleItems = await Schedule.find({ createdBy: userId }).sort({ startTime: 1 });
    
    // Generate basic suggestions
    const suggestions = {
      studyRecommendations: [
        {
          subject: "Review upcoming assignments",
          reason: "You have assignments due soon",
          suggestedTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          duration: 120,
          priority: "high"
        }
      ],
      conflictAlerts: [],
      optimizationTips: [
        "Consider breaking large tasks into smaller chunks",
        "Schedule breaks between intensive study sessions",
        "Set reminders for important deadlines"
      ],
      freeTimeSlots: []
    };

    return res.json({
      success: true,
      message: 'AI suggestions generated successfully',
      data: suggestions
    });

  } catch (error) {
    logger.error('Error generating AI suggestions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate suggestions'
    });
  }
};

// Get analytics
export const getScheduleAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const scheduleItems = await Schedule.find({ createdBy: userId });
    
    // Calculate basic analytics
    const totalScheduledHours = scheduleItems.reduce((total, item) => {
      const duration = (item.endTime.getTime() - item.startTime.getTime()) / (1000 * 60 * 60);
      return total + duration;
    }, 0);

    const completedTasks = scheduleItems.filter(item => item.status === 'completed').length;
    const missedTasks = scheduleItems.filter(item => item.status === 'missed').length;
    
    const typeDistribution: { [key: string]: number } = {};
    scheduleItems.forEach(item => {
      typeDistribution[item.type] = (typeDistribution[item.type] || 0) + 1;
    });

    const analytics = {
      totalScheduledHours: Math.round(totalScheduledHours * 10) / 10,
      completedTasks,
      missedTasks,
      productivityScore: completedTasks > 0 ? Math.round((completedTasks / (completedTasks + missedTasks)) * 100) : 0,
      typeDistribution,
      peakHours: ["9:00 AM", "2:00 PM"],
      recommendations: [
        "Schedule more study sessions during your peak hours",
        "Set up more reminders for important deadlines",
        "Consider time blocking for better focus"
      ]
    };

    return res.json({
      success: true,
      message: 'Analytics retrieved successfully',
      data: analytics
    });

  } catch (error) {
    logger.error('Error getting schedule analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics'
    });
  }
};

// Helper function for backward compatibility (used by email service)
export const initializeUserSchedule = (userId: string) => {
  // This function is kept for backward compatibility but doesn't do anything
  // since we now use database storage
  console.log('📅 User schedule initialization called for:', userId);
  return [];
};
