import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import studentsRoutes from './routes/students';
import aiRoutes from './routes/ai';
import analyticsRoutes from './routes/analytics';
import votingRoutes from './routes/voting';
import scheduleRoutes from './routes/schedule';
import portfolioRoutes from './routes/portfolio';
import adminRoutes from './routes/admin';
import seedRoutes from './routes/seed';
import notificationRoutes from './routes/notifications';

// Load environment variables FIRST
console.log('🔍 Current working directory:', process.cwd());
console.log('🔍 Looking for .env file at:', require('path').resolve('.env'));
const result = dotenv.config({ path: '.env' });
console.log('🔍 dotenv result:', result);
console.log('🔍 EMAIL_USER:', process.env.EMAIL_USER);
console.log('🔍 EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '[SET]' : '[NOT SET]');

// Import and initialize email service AFTER environment variables are loaded
import { emailService } from './services/emailService';
emailService.initialize();

// Import services AFTER environment variables are loaded
import './services/scheduleEmailService'; // Start automatic email scheduler

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW || '15')) * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(limiter); // Apply rate limiting
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Unimate.AI Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Unimate.AI Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      students: '/api/students',
      ai: '/api/ai',
      analytics: '/api/analytics',
      voting: '/api/voting',
      schedule: '/api/schedule',
      portfolio: '/api/portfolio'
    }
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Unimate.AI Backend server running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
