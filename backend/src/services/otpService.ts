import { User } from '../models/User';
import { logger } from '../utils/logger';
import { emailService } from './emailService';

export interface OTPServiceConfig {
  otpLength: number;
  expirationMinutes: number;
  maxAttempts: number;
  votingVerificationDurationMinutes: number;
}

export interface SendOTPResult {
  success: boolean;
  message: string;
  otpSent?: boolean;
  method?: 'email' | 'sms';
}

export interface VerifyOTPResult {
  success: boolean;
  message: string;
  verified?: boolean;
  votingAuthorized?: boolean;
  expiresAt?: Date;
}

class OTPService {
  private config: OTPServiceConfig = {
    otpLength: 6,
    expirationMinutes: 10, // OTP expires in 10 minutes
    maxAttempts: 3,
    votingVerificationDurationMinutes: 30, // Voting authorization lasts 30 minutes
  };

  /**
   * Generate a random OTP code
   */
  private generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < this.config.otpLength; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return otp;
  }

  /**
   * Send OTP via email
   */
  private async sendEmailOTP(email: string, otp: string): Promise<boolean> {
    try {
      emailService.initialize();

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🗳️ Voting Verification</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Secure your vote with OTP verification</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center;">
            <h2 style="color: #333; margin-bottom: 15px;">Your Voting OTP</h2>
            <div style="background: white; border: 2px dashed #667eea; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #666; margin: 15px 0;">This OTP is valid for <strong>${this.config.expirationMinutes} minutes</strong></p>
            <p style="color: #e74c3c; font-size: 14px; margin: 15px 0;">
              ⚠️ Do not share this OTP with anyone. Our team will never ask for your OTP.
            </p>
          </div>
          
          <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-bottom: 10px;">🔐 Security Notice</h3>
            <ul style="color: #555; padding-left: 20px; margin: 0;">
              <li>This OTP authorizes you to vote securely</li>
              <li>You have ${this.config.maxAttempts} attempts to enter the correct OTP</li>
              <li>After verification, you'll have ${this.config.votingVerificationDurationMinutes} minutes to cast your vote</li>
              <li>Each user can only vote once per poll</li>
            </ul>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
            <p>This is an automated message from UniMate.ai Voting System</p>
            <p>If you didn't request this OTP, please ignore this email.</p>
          </div>
        </div>
      `;

      const result = await emailService.sendEmail({
        to: email,
        subject: '🗳️ Your Voting OTP - UniMate.ai',
        html: emailHtml,
        text: `Your UniMate.ai voting OTP is: ${otp}. This OTP is valid for ${this.config.expirationMinutes} minutes. Do not share this code with anyone.`
      });

      return result;
    } catch (error) {
      logger.error('Failed to send email OTP:', error);
      return false;
    }
  }

  /**
   * Send OTP via SMS (Integration template)
   * You can integrate with Twilio, AWS SNS, or other SMS services
   */
  private async sendSMSOTP(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      // SMS Integration Template
      // Uncomment and configure based on your SMS service provider
      
      /*
      // Example with Twilio:
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      await client.messages.create({
        body: `Your UniMate.ai voting OTP is: ${otp}. Valid for ${this.config.expirationMinutes} minutes. Do not share this code.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      
      return true;
      */

      // For now, we'll log the SMS (replace with actual SMS service)
      logger.info(`SMS OTP would be sent to ${phoneNumber}: ${otp}`);
      
      // Return true for demonstration (replace with actual SMS result)
      return true;
    } catch (error) {
      logger.error('Failed to send SMS OTP:', error);
      return false;
    }
  }

  /**
   * Request OTP for voting verification
   */
  async requestVotingOTP(userId: string, method: 'email' | 'sms'): Promise<SendOTPResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Check if user has required contact information
      if (method === 'email' && !user.email) {
        return {
          success: false,
          message: 'Email address not found for this user'
        };
      }

      if (method === 'sms' && !user.phoneNumber) {
        return {
          success: false,
          message: 'Phone number not found. Please add your phone number in profile settings first.'
        };
      }

      // Rate limiting: Check if user requested OTP recently
      const now = new Date();
      if (user.votingVerification.lastVotingOtpAt) {
        const timeSinceLastOTP = now.getTime() - user.votingVerification.lastVotingOtpAt.getTime();
        const oneMinute = 60 * 1000;
        if (timeSinceLastOTP < oneMinute) {
          return {
            success: false,
            message: 'Please wait at least 1 minute before requesting another OTP'
          };
        }
      }

      // Generate new OTP
      const otpCode = this.generateOTP();
      const expiresAt = new Date(now.getTime() + (this.config.expirationMinutes * 60 * 1000));

      // Save OTP to user
      user.otp = {
        code: otpCode,
        type: method,
        expiresAt: expiresAt,
        verified: false,
        attempts: 0
      };
      user.votingVerification.lastVotingOtpAt = now;
      user.votingVerification.isVerifiedForVoting = false; // Reset voting verification

      await user.save();

      // Send OTP based on method
      let otpSent = false;
      if (method === 'email') {
        otpSent = await this.sendEmailOTP(user.email, otpCode);
      } else if (method === 'sms') {
        otpSent = await this.sendSMSOTP(user.phoneNumber!, otpCode);
      }

      if (!otpSent) {
        return {
          success: false,
          message: `Failed to send OTP via ${method}. Please try again.`
        };
      }

      logger.info(`Voting OTP sent to user ${userId} via ${method}`);

      return {
        success: true,
        message: `OTP sent successfully via ${method}. Please check your ${method === 'email' ? 'email' : 'phone'} and enter the code to verify.`,
        otpSent: true,
        method: method
      };

    } catch (error) {
      logger.error('Request OTP error:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.'
      };
    }
  }

  /**
   * Verify OTP and authorize voting
   */
  async verifyVotingOTP(userId: string, enteredOTP: string): Promise<VerifyOTPResult> {
    try {
      const user = await User.findById(userId).select('+otp.code');
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Check if OTP exists
      if (!user.otp.code || !user.otp.expiresAt) {
        return {
          success: false,
          message: 'No OTP found. Please request a new OTP.'
        };
      }

      // Check if OTP is expired
      const now = new Date();
      if (now > user.otp.expiresAt) {
        // Clear expired OTP
        user.otp = {
          verified: false,
          attempts: 0
        };
        await user.save();

        return {
          success: false,
          message: 'OTP has expired. Please request a new OTP.'
        };
      }

      // Check attempts limit
      if ((user.otp.attempts || 0) >= this.config.maxAttempts) {
        // Clear OTP after max attempts
        user.otp = {
          verified: false,
          attempts: 0
        };
        await user.save();

        return {
          success: false,
          message: 'Maximum OTP attempts exceeded. Please request a new OTP.'
        };
      }

      // Verify OTP
      if (user.otp.code !== enteredOTP) {
        user.otp.attempts = (user.otp.attempts || 0) + 1;
        await user.save();

        const remainingAttempts = this.config.maxAttempts - user.otp.attempts;
        return {
          success: false,
          message: `Invalid OTP. You have ${remainingAttempts} attempt(s) remaining.`
        };
      }

      // OTP is correct - Grant voting authorization
      const votingExpiresAt = new Date(now.getTime() + (this.config.votingVerificationDurationMinutes * 60 * 1000));
      
      user.otp.verified = true;
      user.otp.verifiedAt = now;
      user.votingVerification.isVerifiedForVoting = true;
      user.votingVerification.verificationExpiresAt = votingExpiresAt;

      await user.save();

      logger.info(`User ${userId} successfully verified OTP and authorized for voting`);

      return {
        success: true,
        message: `OTP verified successfully! You can now vote. Your voting authorization expires in ${this.config.votingVerificationDurationMinutes} minutes.`,
        verified: true,
        votingAuthorized: true,
        expiresAt: votingExpiresAt
      };

    } catch (error) {
      logger.error('Verify OTP error:', error);
      return {
        success: false,
        message: 'Failed to verify OTP. Please try again.'
      };
    }
  }

  /**
   * Check if user is currently authorized to vote
   */
  async isUserAuthorizedToVote(userId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return false;
      }

      const now = new Date();
      return (user.votingVerification.isVerifiedForVoting === true) &&
             !!user.votingVerification.verificationExpiresAt &&
             now <= user.votingVerification.verificationExpiresAt;
    } catch (error) {
      logger.error('Check voting authorization error:', error);
      return false;
    }
  }

  /**
   * Clear voting authorization (called after successful vote or timeout)
   */
  async clearVotingAuthorization(userId: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, {
        'votingVerification.isVerifiedForVoting': false,
        'votingVerification.verificationExpiresAt': null
      });
      
      logger.info(`Cleared voting authorization for user ${userId}`);
    } catch (error) {
      logger.error('Clear voting authorization error:', error);
    }
  }
}

export const otpService = new OTPService();
