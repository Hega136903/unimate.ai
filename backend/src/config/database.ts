import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      logger.info('🔧 MONGODB_URI not found in .env file. Server will run without database connection.');
      logger.info('� To enable database functionality, add MONGODB_URI to your .env file.');
      return;
    }
    
    const conn = await mongoose.connect(mongoURI);
    
    logger.info(`🍃 MongoDB Connected: ${conn.connection.host}`);
    logger.info(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    logger.warn('⚠️ MongoDB connection failed - running without database:', error);
    logger.info('🔧 For full functionality, please install and start MongoDB');
    // Don't exit the process - allow the server to run without database for development
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('🔌 MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  logger.error('❌ MongoDB error:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('🔌 MongoDB connection closed through app termination');
  } catch (error) {
    logger.info('🔌 App termination (no database connection)');
  }
  process.exit(0);
});
