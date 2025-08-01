import { Request, Response } from 'express';
import { User } from '../models/User';

interface AuthenticatedRequest extends Request {
  user?: any;
}

interface Project {
  id?: string;
  title: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  createdAt?: Date;
}

interface Skill {
  id?: string;
  name: string;
  level: number;
  category: string;
}

interface Achievement {
  id?: string;
  title: string;
  description: string;
  date: string;
  certificateUrl?: string;
  issuer: string;
}

interface PortfolioData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
    bio: string;
    avatar?: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
  projects: Project[];
  skills: Skill[];
  achievements: Achievement[];
  isPublic: boolean;
  username: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create or update portfolio
export const createPortfolio = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const portfolioData: PortfolioData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Add timestamps
    portfolioData.createdAt = new Date();
    portfolioData.updatedAt = new Date();

    // Generate username if not provided
    if (!portfolioData.username) {
      portfolioData.username = user.email.split('@')[0];
    }

    // Update user with portfolio data
    user.portfolio = portfolioData;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Portfolio created successfully',
      data: { portfolio: portfolioData }
    });
  } catch (error: any) {
    console.error('Create portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating portfolio',
      error: { message: error.message }
    });
  }
};

// Get user's own portfolio
export const getPortfolio = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('portfolio firstName lastName email');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    if (!user.portfolio) {
      res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { portfolio: user.portfolio }
    });
  } catch (error: any) {
    console.error('Get portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching portfolio',
      error: { message: error.message }
    });
  }
};

// Update portfolio
export const updatePortfolio = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const portfolioData: PortfolioData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Update timestamp
    portfolioData.updatedAt = new Date();
    if (user.portfolio && user.portfolio.createdAt) {
      portfolioData.createdAt = user.portfolio.createdAt;
    } else {
      portfolioData.createdAt = new Date();
    }

    // Generate username if not provided
    if (!portfolioData.username) {
      portfolioData.username = user.email.split('@')[0];
    }

    user.portfolio = portfolioData;
    await user.save();

    res.json({
      success: true,
      message: 'Portfolio updated successfully',
      data: { portfolio: portfolioData }
    });
  } catch (error: any) {
    console.error('Update portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating portfolio',
      error: { message: error.message }
    });
  }
};

// Delete portfolio
export const deletePortfolio = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    user.portfolio = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Portfolio deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting portfolio',
      error: { message: error.message }
    });
  }
};

// Get public portfolio by username
export const getPublicPortfolio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ 
      'portfolio.username': username,
      'portfolio.isPublic': true 
    }).select('portfolio firstName lastName email');

    if (!user || !user.portfolio) {
      res.status(404).json({
        success: false,
        message: 'Portfolio not found or not public'
      });
      return;
    }

    res.json({
      success: true,
      data: { portfolio: user.portfolio }
    });
  } catch (error: any) {
    console.error('Get public portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching public portfolio',
      error: { message: error.message }
    });
  }
};

// Add project to portfolio
export const addProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const projectData: Project = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    if (!user.portfolio) {
      res.status(404).json({
        success: false,
        message: 'Portfolio not found. Please create a portfolio first.'
      });
      return;
    }

    // Add ID and timestamp to project
    const newProject = {
      ...projectData,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    user.portfolio.projects = user.portfolio.projects || [];
    user.portfolio.projects.push(newProject);
    user.portfolio.updatedAt = new Date();

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Project added successfully',
      data: { project: newProject }
    });
  } catch (error: any) {
    console.error('Add project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding project',
      error: { message: error.message }
    });
  }
};

// Update project in portfolio
export const updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;
    const projectData: Partial<Project> = req.body;

    const user = await User.findById(userId);
    if (!user || !user.portfolio) {
      res.status(404).json({
        success: false,
        message: 'User or portfolio not found'
      });
      return;
    }

    const projectIndex = user.portfolio.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }

    // Update project
    user.portfolio.projects[projectIndex] = {
      ...user.portfolio.projects[projectIndex],
      ...projectData
    };
    user.portfolio.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project: user.portfolio.projects[projectIndex] }
    });
  } catch (error: any) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: { message: error.message }
    });
  }
};

// Delete project from portfolio
export const deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const user = await User.findById(userId);
    if (!user || !user.portfolio) {
      res.status(404).json({
        success: false,
        message: 'User or portfolio not found'
      });
      return;
    }

    user.portfolio.projects = user.portfolio.projects.filter(p => p.id !== projectId);
    user.portfolio.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: { message: error.message }
    });
  }
};

// Add skill to portfolio
export const addSkill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const skillData: Skill = req.body;

    const user = await User.findById(userId);
    if (!user || !user.portfolio) {
      res.status(404).json({
        success: false,
        message: 'User or portfolio not found'
      });
      return;
    }

    const newSkill = {
      ...skillData,
      id: Date.now().toString()
    };

    user.portfolio.skills = user.portfolio.skills || [];
    user.portfolio.skills.push(newSkill);
    user.portfolio.updatedAt = new Date();

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Skill added successfully',
      data: { skill: newSkill }
    });
  } catch (error: any) {
    console.error('Add skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding skill',
      error: { message: error.message }
    });
  }
};

// Delete skill from portfolio
export const deleteSkill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { skillId } = req.params;

    const user = await User.findById(userId);
    if (!user || !user.portfolio) {
      res.status(404).json({
        success: false,
        message: 'User or portfolio not found'
      });
      return;
    }

    user.portfolio.skills = user.portfolio.skills.filter(s => s.id !== skillId);
    user.portfolio.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Skill deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting skill',
      error: { message: error.message }
    });
  }
};

// Add achievement to portfolio
export const addAchievement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const achievementData: Achievement = req.body;

    const user = await User.findById(userId);
    if (!user || !user.portfolio) {
      res.status(404).json({
        success: false,
        message: 'User or portfolio not found'
      });
      return;
    }

    const newAchievement = {
      ...achievementData,
      id: Date.now().toString()
    };

    user.portfolio.achievements = user.portfolio.achievements || [];
    user.portfolio.achievements.push(newAchievement);
    user.portfolio.updatedAt = new Date();

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Achievement added successfully',
      data: { achievement: newAchievement }
    });
  } catch (error: any) {
    console.error('Add achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding achievement',
      error: { message: error.message }
    });
  }
};

// Delete achievement from portfolio
export const deleteAchievement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { achievementId } = req.params;

    const user = await User.findById(userId);
    if (!user || !user.portfolio) {
      res.status(404).json({
        success: false,
        message: 'User or portfolio not found'
      });
      return;
    }

    user.portfolio.achievements = user.portfolio.achievements.filter(a => a.id !== achievementId);
    user.portfolio.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Achievement deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting achievement',
      error: { message: error.message }
    });
  }
};

// Get all public portfolios (for discovery)
export const getAllPublicPortfolios = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ 
      'portfolio.isPublic': true,
      portfolio: { $exists: true }
    })
    .select('portfolio.personalInfo.fullName portfolio.personalInfo.summary portfolio.username portfolio.personalInfo.avatar')
    .skip(skip)
    .limit(limit);

    const total = await User.countDocuments({ 
      'portfolio.isPublic': true,
      portfolio: { $exists: true }
    });

    res.json({
      success: true,
      data: {
        portfolios: users.map(user => ({
          fullName: user.portfolio?.personalInfo.fullName,
          summary: user.portfolio?.personalInfo.summary,
          username: user.portfolio?.username,
          avatar: user.portfolio?.personalInfo.avatar
        })),
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error: any) {
    console.error('Get all public portfolios error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching public portfolios',
      error: { message: error.message }
    });
  }
};
