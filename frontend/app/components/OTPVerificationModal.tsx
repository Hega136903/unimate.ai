'use client';

import React, { useState } from 'react';
import { API_BASE_URL } from '../lib/api';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  userEmail?: string;
  userPhone?: string;
}

interface OTPResponse {
  success: boolean;
  message: string;
  data?: {
    otpSent?: boolean;
    method?: 'email' | 'sms';
    expirationMinutes?: number;
    verified?: boolean;
    votingAuthorized?: boolean;
    authorizationExpiresAt?: string;
    votingDurationMinutes?: number;
  };
}

const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  userEmail,
  userPhone
}) => {
  const [step, setStep] = useState<'enter-otp'>('enter-otp');
  const [selectedMethod] = useState<'email'>('email');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [attempts, setAttempts] = useState(0);

  const getAuthToken = () => {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  };

  // Auto-request OTP when modal opens
  React.useEffect(() => {
    if (isOpen && !otpSent) {
      requestOTP('email');
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (otpSent && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpSent, timeRemaining]);

  const requestOTP = async (method: 'email') => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/otp/request-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method }),
      });

      const data: OTPResponse = await response.json();

      if (data.success) {
        setOtpSent(true);
        setTimeRemaining(600); // Reset timer to 10 minutes
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    const token = getAuthToken();
    if (!token) return;

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔑 Verifying OTP:', otp);
      
      const response = await fetch(`${API_BASE_URL}/otp/verify-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
      });

      console.log('🔑 OTP verification response status:', response.status);
      
      const data: OTPResponse = await response.json();
      console.log('🔑 OTP verification response data:', data);

      if (data.success && data.data?.votingAuthorized) {
        console.log('✅ OTP verification successful!');
        onVerified();
        handleClose();
      } else {
        setAttempts(prev => prev + 1);
        setError(data.message || 'Failed to verify OTP');
        setOtp('');
      }
    } catch (err) {
      console.error('🔑 OTP verification error:', err);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOtp('');
    setError(null);
    setOtpSent(false);
    setAttempts(0);
    setTimeRemaining(600);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">� Email OTP Verification</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* OTP Entry Step */}
        <div>
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">📧</div>
            <p className="text-gray-600">
              OTP sent to your email address
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {userEmail && (
                <span>Sent to: {userEmail.substring(0, 3)}***@{userEmail.split('@')[1]}</span>
              )}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Expires in: <span className="font-medium text-red-600">{formatTime(timeRemaining)}</span>
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 6-digit OTP code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full text-center text-2xl font-mono border-2 border-gray-300 rounded-lg py-3 px-4 focus:border-blue-500 focus:outline-none"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
              {error}
              {attempts > 0 && (
                <p className="text-sm mt-1">Attempts: {attempts}/3</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={verifyOTP}
              disabled={loading || otp.length !== 6 || timeRemaining <= 0}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Verify & Authorize Voting'
              )}
            </button>

            <button
              onClick={() => requestOTP('email')}
              disabled={loading || timeRemaining > 540} // Allow resend after 1 minute
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {timeRemaining > 540 ? 'Resend available in 1 minute' : 'Resend OTP'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Security Note:</strong> After verification, you'll have 30 minutes to cast your vote. 
              Keep this code confidential and never share it with anyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationModal;
