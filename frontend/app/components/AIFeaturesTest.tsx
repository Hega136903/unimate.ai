'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/api';

interface AIRecommendation {
  studyTips: string[];
  courseRecommendations: string[];
  scheduleOptimizations: string[];
  personalizedAdvice: string;
}

interface StudySession {
  id: string;
  topic: string;
  duration: number;
  difficulty: string;
  exercises: any[];
  resources: string[];
  summary: string;
}

const AIFeatures = () => {
  const { user, loading: authLoading, isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Enhanced authentication state management
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  
  useEffect(() => {
    // Enhanced authentication check with debugging
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const hasLocalAuth = !!(token && userStr);
      const hasContextAuth = !!user && isLoggedIn;
      const finalAuthState = hasLocalAuth || hasContextAuth;
      
      // Debug logging
      console.log('Auth Debug - Token:', !!token, 'User:', !!userStr, 'Context User:', !!user, 'Context Login:', isLoggedIn, 'Final:', finalAuthState);
      
      setIsUserLoggedIn(finalAuthState);
    };
    
    checkAuth();
  }, [user, isLoggedIn, authLoading]);

  const [recommendations, setRecommendations] = useState<AIRecommendation | null>(null);
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [summarizedContent, setSummarizedContent] = useState('');
  const [contentToSummarize, setContentToSummarize] = useState('');

  // Simple user plan inputs for better personalization
  const [planGoals, setPlanGoals] = useState('');
  const [planSubjects, setPlanSubjects] = useState('');
  const [planAvailability, setPlanAvailability] = useState('');

  // Study Session Form State
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionDuration, setSessionDuration] = useState(30);
  const [sessionDifficulty, setSessionDifficulty] = useState('intermediate');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const handleGetRecommendations = async () => {
    const token = localStorage.getItem('token');
    console.log('Making API call with token:', !!token);
    
    setLoading(true);
  // Clear previous recommendations before fetching to avoid duplicate sections
  setRecommendations(null);
    try {
    const response = await fetch(`${API_BASE_URL}/ai/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          plan: {
            goals: planGoals,
            subjects: planSubjects,
            availability: planAvailability
          }
        })
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          alert('Authentication failed (401). Please log out and log in again to refresh your session.');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API response:', data);
      setRecommendations(data.data);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to get AI recommendations: ${errorMessage}. Please make sure you're logged in and the backend server is running.`);
    } finally {
      setLoading(false);
    }
  };

  // Tab UI removed; recommendations shown by default

  if (authLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-100">
        <div className="container mx-auto px-6 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading AI Features...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-100">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">🤖 AI-Powered Study Assistant</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get personalized study recommendations, create custom study sessions, and summarize complex content with our advanced AI technology.
          </p>
        </div>

  {/* Tab Navigation removed */}

  {/* Study Recommendations */}
  {
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Get Personalized Study Recommendations</h3>
              <p className="text-gray-600 mb-6">
                Get AI-powered suggestions for study techniques, courses, and schedule optimizations tailored to your learning style.
              </p>
              {/* User Plan Inputs */}
              <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-4 mb-6 text-left">
                <h4 className="font-semibold text-gray-800 mb-3">Optional: Share your plan for sharper recommendations</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  <input
                    value={planGoals}
                    onChange={(e) => setPlanGoals(e.target.value)}
                    placeholder="Your goals (e.g., crack DSA, top grades)"
                    className="border rounded px-3 py-2 w-full focus:outline-none focus:ring"
                  />
                  <input
                    value={planSubjects}
                    onChange={(e) => setPlanSubjects(e.target.value)}
                    placeholder="Subjects (e.g., ML, OS, DBMS)"
                    className="border rounded px-3 py-2 w-full focus:outline-none focus:ring"
                  />
                  <input
                    value={planAvailability}
                    onChange={(e) => setPlanAvailability(e.target.value)}
                    placeholder="Availability (e.g., 2h/day, weekends)"
                    className="border rounded px-3 py-2 w-full focus:outline-none focus:ring"
                  />
                </div>
              </div>
              
              <button
                onClick={handleGetRecommendations}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Generating Recommendations...' : 'Get AI Recommendations'}
              </button>
              
              {/* Debug info removed */}
            </div>

            {recommendations && (
              <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
                <h4 className="text-xl font-semibold text-gray-800 mb-6">Your Personalized Recommendations</h4>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h5 className="font-semibold text-blue-600 mb-3">📚 Study Tips</h5>
                    <ul className="space-y-2">
                      {recommendations.studyTips.map((tip, index) => (
                        <li key={index} className="text-gray-700 flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-green-600 mb-3">🎓 Course Recommendations</h5>
                    <ul className="space-y-2">
                      {recommendations.courseRecommendations.map((course, index) => (
                        <li key={index} className="text-gray-700 flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          {course}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8">
                  <h5 className="font-semibold text-purple-600 mb-3">⏰ Schedule Optimizations</h5>
                  <ul className="space-y-2">
                    {recommendations.scheduleOptimizations.map((optimization, index) => (
                      <li key={index} className="text-gray-700 flex items-start">
                        <span className="text-purple-500 mr-2">•</span>
                        {optimization}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <h5 className="font-semibold text-gray-800 mb-2">💡 Personalized Advice</h5>
                  <p className="text-gray-700">{recommendations.personalizedAdvice}</p>
                </div>
              </div>
            )}
          </div>
        }
      </div>
    </section>
  );
};

export default AIFeatures;
