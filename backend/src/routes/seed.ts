import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const router = express.Router();

// POST /api/seed/admin - Create admin user (development only)
router.post('/admin', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@unimate.ai' });
    if (existingAdmin) {
      res.json({
        success: true,
        message: 'Admin user already exists',
        credentials: {
          email: 'admin@unimate.ai',
          password: 'admin123'
        }
      });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    // Create admin user
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@unimate.ai',
      password: hashedPassword,
      role: 'admin',
      university: 'Unimate University',
      department: 'Administration',
      isActive: true,
      preferences: {
        notifications: true,
        darkMode: false,
        language: 'en'
      }
    });

    await adminUser.save();

    logger.info('Admin user created successfully');

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      credentials: {
        email: 'admin@unimate.ai',
        password: 'admin123'
      },
      user: {
        id: adminUser._id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    logger.error('Error creating admin user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/seed/admin-info - Get admin credentials info
router.get('/admin-info', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminExists = await User.findOne({ email: 'admin@unimate.ai' });
    
    res.json({
      success: true,
      adminExists: !!adminExists,
      credentials: {
        email: 'admin@unimate.ai',
        password: 'admin123'
      },
      instructions: [
        '1. Use the red Admin button in the header',
        '2. Or login manually with the credentials above',
        '3. Admin panel will be accessible at /admin'
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking admin user'
    });
  }
});

export default router;
