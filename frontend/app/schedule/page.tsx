'use client';

import { useAuth } from '../context/AuthContext';
import SmartScheduleManager from '../components/SmartScheduleManager';
import LoginModal from '../components/LoginModal';
import { useState } from 'react';

export default function SchedulePage() {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">📅 Schedule Manager</h1>
          <p className="text-gray-600 mb-6">Please log in to access your schedule and deadline alerts.</p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login to Continue
          </button>
        </div>
        
        {showLoginModal && (
          <LoginModal 
            isOpen={showLoginModal} 
            onClose={() => setShowLoginModal(false)}
            onSwitchToRegister={() => {}}
          />
        )}
      </div>
    );
  }

  return <SmartScheduleManager />;
}
