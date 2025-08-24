import { logger } from '../utils/logger';

class KeepAliveService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL = 10 * 60 * 1000; // 10 minutes
  private readonly SERVICE_URL = process.env.RENDER_EXTERNAL_URL || 'https://unimate-ai.onrender.com';

  start() {
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_KEEP_ALIVE === 'true') {
      logger.info('🔄 Starting keep-alive service...');
      
      this.intervalId = setInterval(async () => {
        try {
          const response = await fetch(`${this.SERVICE_URL}/api/health`, {
            method: 'GET',
            headers: {
              'User-Agent': 'KeepAlive-Service'
            }
          });
          
          if (response.ok) {
            logger.info(`✅ Keep-alive ping successful: ${response.status}`);
          } else {
            logger.warn(`⚠️ Keep-alive ping returned: ${response.status}`);
          }
        } catch (error) {
          logger.error('❌ Keep-alive ping failed:', error);
        }
      }, this.PING_INTERVAL);

      // Initial ping after 30 seconds
      setTimeout(() => {
        this.ping();
      }, 30000);

      logger.info(`🚀 Keep-alive service started - pinging every ${this.PING_INTERVAL / 1000 / 60} minutes`);
    } else {
      logger.info('⏹️ Keep-alive service disabled (not in production or ENABLE_KEEP_ALIVE not set)');
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('🛑 Keep-alive service stopped');
    }
  }

  private async ping() {
    try {
      const response = await fetch(`${this.SERVICE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'KeepAlive-Service-Initial'
        }
      });
      logger.info(`🔄 Initial keep-alive ping: ${response.status}`);
    } catch (error) {
      logger.error('❌ Initial keep-alive ping failed:', error);
    }
  }
}

export const keepAliveService = new KeepAliveService();
