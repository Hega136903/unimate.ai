import cron from 'node-cron';
import { logger } from '../utils/logger';
import Schedule from '../models/Schedule';

// Clean up old schedule items: delete items whose endTime is older than retention days
// Default retention is 1 day after endTime. Override with SCHEDULE_RETENTION_DAYS.
const retentionDays = parseInt(process.env.SCHEDULE_RETENTION_DAYS || '1', 10);

const runCleanup = async () => {
  try {
    const threshold = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    // Exclude recurring templates just in case
    const query: any = { endTime: { $lt: threshold } };

    const toDeleteCount = await Schedule.countDocuments(query);
    if (toDeleteCount > 0) {
      const result = await Schedule.deleteMany(query);
      logger.info(`🧹 Schedule cleanup: deleted ${result.deletedCount} items older than ${retentionDays} day(s).`);
    } else {
      logger.info('🧹 Schedule cleanup: nothing to delete.');
    }
  } catch (err) {
    logger.error('❌ Schedule cleanup failed:', err);
  }
};

// Schedule daily at 02:15 AM server time
cron.schedule('15 2 * * *', async () => {
  logger.info('🧹 Running scheduled schedule-cleanup job...');
  await runCleanup();
});

// Also run once on startup (non-blocking)
runCleanup().catch(() => {});

export {}; 
