'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../lib/api';

interface OpenAIStatus {
  connected: boolean;
  message: string;
  lastChecked: Date;
}

export default function OpenAIStatusIndicator() {
  const [status, setStatus] = useState<OpenAIStatus>({ 
    connected: false, 
    message: 'Checking...', 
    lastChecked: new Date() 
  });

  const checkOpenAIStatus = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        setStatus({
          connected: true,
          message: '✅ Backend Connected',
          lastChecked: new Date()
        });
      } else {
        setStatus({
          connected: false,
          message: '⚠️ Backend reachable but returned an error',
          lastChecked: new Date()
        });
      }
    } catch (error) {
      setStatus({
        connected: false,
        message: '❌ Backend connection failed',
        lastChecked: new Date()
      });
    }
  };

  useEffect(() => {
    checkOpenAIStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkOpenAIStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed bottom-4 right-4 max-w-xs p-3 rounded-lg shadow-lg border text-sm ${
      status.connected 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }`}>
      <div className="font-medium mb-1">{status.message}</div>
      <div className="text-xs opacity-70">
        Last checked: {status.lastChecked.toLocaleTimeString()}
      </div>
      <button
        onClick={checkOpenAIStatus}
        className="text-xs mt-2 px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75 transition-colors"
      >
        Refresh Status
      </button>
      
      {!status.connected && (
        <div className="mt-2 text-xs">
          <a 
            href="/OPENAI_SETUP.md" 
            target="_blank" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Setup OpenAI →
          </a>
        </div>
      )}
    </div>
  );
}
