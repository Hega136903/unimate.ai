import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    // Explicitly use MongoDB Atlas URI - force it even if env var is not loaded
    const mongoURI = process.env.MONGODB_URI || 
      'mongodb+srv://221501044:Sripriyan%40619@cluster0.jdhu8rq.mongodb.net/unimate-ai?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('🔍 Attempting to connect to MongoDB:', mongoURI.substring(0, 50) + '...');
    
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
