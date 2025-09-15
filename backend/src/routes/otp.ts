import express from 'express';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { otpService } from '../services/otpService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Request OTP for voting
router.post('/request-otp', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { method } = req.body; // 'email' or 'sms'

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!method || !['email', 'sms'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Valid method is required. Choose "email" or "sms"'
      });
    }

    const result = await otpService.requestVotingOTP(userId, method);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`OTP requested by user ${userId} via ${method}`);

    return res.json({
      success: true,
      message: result.message,
      data: {
        otpSent: result.otpSent,
        method: result.method,
        expirationMinutes: 10 // OTP expires in 10 minutes
      }
    });

  } catch (error) {
    logger.error('Request OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to request OTP. Please try again.'
    });
  }
});

// Verify OTP and authorize voting
router.post('/verify-otp', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { otp } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!otp || typeof otp !== 'string' || otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Valid 6-digit OTP is required'
      });
    }

    const result = await otpService.verifyVotingOTP(userId, otp);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`OTP verified successfully for user ${userId}`);

    return res.json({
      success: true,
      message: result.message,
      data: {
        verified: result.verified,
        votingAuthorized: result.votingAuthorized,
        authorizationExpiresAt: result.expiresAt,
        votingDurationMinutes: 30 // User has 30 minutes to vote
      }
    });

  } catch (error) {
    logger.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    });
  }
});

// Check voting authorization status
router.get('/voting-status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const isAuthorized = await otpService.isUserAuthorizedToVote(userId);

    return res.json({
      success: true,
      data: {
        isAuthorizedToVote: isAuthorized,
        message: isAuthorized 
          ? 'You are authorized to vote' 
          : 'OTP verification required to vote'
      }
    });

  } catch (error) {
    logger.error('Check voting status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check voting status'
    });
  }
});

export default router;
