'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔍 Admin login attempt:', { email, password });

    // Check for development admin credentials
    if (email === 'admin@unimate.ai' && password === 'admin123') {
      console.log('🔍 Development admin credentials detected');
      
      // Create development admin session
      const devAdminUser = {
        id: 'dev-admin',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@rajalakshmi.edu.in',
        role: 'admin' as const,
        university: 'Rajalakshmi Engineering College',
        department: 'Administration',
        year: 0,
        preferences: {
          notifications: true,
          darkMode: false,
          language: 'en'
        },
        aiUsage: {
          questionsAsked: 0,
          studySessionsCreated: 0
        }
      };

      // Store development admin session
      localStorage.setItem('token', 'dev-admin-token-' + Date.now());
      localStorage.setItem('user', JSON.stringify(devAdminUser));
      
      console.log('✅ Development admin session created');
      setLoading(false);
      onClose();
      
      // Give a small delay to ensure localStorage is written, then redirect
      setTimeout(() => {
        window.location.href = '/admin';
      }, 500);
      return;
    }

    try {
      const result = await login(email, password);
      console.log('🔍 Login result:', result);
      
      if (result.success) {
        // Check if user has admin role
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('🔍 User data from localStorage:', userData);
        
        if (userData.role === 'admin') {
          console.log('✅ Admin access granted');
          onClose();
          window.location.href = '/admin';
        } else {
          console.log('❌ Not an admin user:', userData.role);
          setError('Access denied: Admin privileges required');
        }
      } else {
        console.log('❌ Login failed:', result.message);
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      console.log('❌ Login error:', error);
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setError('Session cleared. Please try logging in again.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🔧 Admin Login
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Admin Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              placeholder="admin@unimate.ai"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Admin Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter admin password"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              } text-white py-2 px-4 rounded-md transition-colors`}
            >
              {loading ? 'Logging in...' : 'Login as Admin'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
