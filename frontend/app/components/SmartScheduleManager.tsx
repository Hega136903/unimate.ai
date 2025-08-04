'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/api';

interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  type: 'class' | 'assignment' | 'exam' | 'study-session' | 'personal' | 'meeting';
  startTime: string;
  endTime: string;
  location?: string;
  course?: string;
  professor?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'missed';
  color?: string;
}

interface Suggestion {
  studyRecommendations: Array<{
    subject: string;
    reason: string;
    suggestedTime: string;
    duration: number;
    priority: string;
  }>;
  conflictAlerts: Array<{
    item1: string;
    item2: string;
    time: string;
    severity: string;
  }>;
  optimizationTips: string[];
  freeTimeSlots: Array<{
    date: string;
    slots: Array<{
      start: string;
      end: string;
      duration: number;
    }>;
  }>;
}

interface Analytics {
  totalScheduledHours: number;
  completedTasks: number;
  missedTasks: number;
  productivityScore: number;
  typeDistribution: {
    [key: string]: number;
  };
  peakHours: string[];
  recommendations: string[];
}

const SmartScheduleManager: React.FC = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedView, setSelectedView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deadlineAlerts, setDeadlineAlerts] = useState<ScheduleItem[]>([]);
  const [showDeadlineAlerts, setShowDeadlineAlerts] = useState(false);

  // New schedule item form
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    type: 'class' as const,
    startTime: '',
    endTime: '',
    location: '',
    course: '',
    professor: '',
    priority: 'medium' as const,
    color: '#3B82F6'
  });

  const getAuthToken = () => {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  };

  useEffect(() => {
    if (user) {
      fetchSchedule();
      fetchSuggestions();
      fetchAnalytics();
    }
  }, [user, selectedDate]);

  useEffect(() => {
    if (schedule.length > 0) {
      checkDeadlineAlerts();
    }
  }, [schedule]);

  // Refresh deadline alerts every minute
  useEffect(() => {
    if (schedule.length > 0) {
      const interval = setInterval(() => {
        checkDeadlineAlerts();
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [schedule]);

  const checkDeadlineAlerts = () => {
    const now = new Date();
    const upcomingDeadlines: ScheduleItem[] = [];
    
    schedule.forEach(item => {
      if (item.type === 'assignment' || item.type === 'exam') {
        const deadlineTime = new Date(item.endTime);
        const timeDiff = deadlineTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        
        // Alert for deadlines within 24 hours (urgent) or 3 days (warning)
        if (timeDiff > 0 && (hoursDiff <= 24 || daysDiff <= 3)) {
          upcomingDeadlines.push({
            ...item,
            priority: hoursDiff <= 24 ? 'urgent' : (daysDiff <= 1 ? 'high' : 'medium')
          });
        }
      }
    });
    
    setDeadlineAlerts(upcomingDeadlines);
    
    // Show alert notification if there are urgent deadlines (within 24 hours)
    const urgentDeadlines = upcomingDeadlines.filter(item => {
      const deadlineTime = new Date(item.endTime);
      const timeDiff = deadlineTime.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);
      return hoursDiff <= 24;
    });
    
    if (urgentDeadlines.length > 0 && !showDeadlineAlerts) {
      setShowDeadlineAlerts(true);
      showNotification(
        `⚠️ Urgent: ${urgentDeadlines.length} deadline(s) approaching within 24 hours!`, 
        'error'
      );
      
      // Auto-send email notification if user has email notifications enabled
      sendEmailAlerts(upcomingDeadlines);
    }
  };

  const fetchSchedule = async () => {
    const token = getAuthToken();
    if (!token) {
      console.log('📅 No auth token found for schedule fetch');
      return;
    }

    try {
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);
      
      if (selectedView === 'week') {
        startDate.setDate(startDate.getDate() - startDate.getDay());
        endDate.setDate(startDate.getDate() + 6);
      } else if (selectedView === 'month') {
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1, 0);
      }

      const url = `${API_BASE_URL}/schedule?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      console.log('📅 Fetching schedule from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📅 Schedule response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('📅 Schedule fetch error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📅 Schedule data received:', data);
      
      if (data.success) {
        setSchedule(data.data || []); // Backend returns data directly, not data.schedule
        console.log('📅 Schedule items set:', data.data?.length || 0);
      } else {
        console.error('📅 Schedule API returned success: false', data);
        showNotification(data.message || 'Error fetching schedule', 'error');
      }
    } catch (error) {
      console.error('📅 Schedule fetch error:', error);
      showNotification(`Error fetching schedule: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/schedule/suggestions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuggestions(data.data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const fetchAnalytics = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/schedule/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const createScheduleItem = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/schedule/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      const data = await response.json();
      if (data.success) {
        showNotification('Schedule item created successfully!', 'success');
        setShowCreateModal(false);
        setNewItem({
          title: '',
          description: '',
          type: 'class',
          startTime: '',
          endTime: '',
          location: '',
          course: '',
          professor: '',
          priority: 'medium',
          color: '#3B82F6'
        });
        fetchSchedule();
      } else {
        showNotification(data.message || 'Failed to create schedule item', 'error');
      }
    } catch (error) {
      showNotification('Error creating schedule item', 'error');
    }
  };

  const createStudySession = async (subject: string, topic: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/schedule/study-sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          topic,
          duration: 90,
          goals: [`Study ${topic}`, 'Practice problems', 'Review notes']
        }),
      });

      const data = await response.json();
      if (data.success) {
        showNotification(`Study session for ${subject} created!`, 'success');
        fetchSchedule();
      }
    } catch (error) {
      showNotification('Error creating study session', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Email notification functions
  const sendEmailAlerts = async (alerts: ScheduleItem[]) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/deadline-alerts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alerts }),
      });

      const data = await response.json();
      if (data.success) {
        showNotification(`📧 Email alert sent successfully!`, 'success');
      }
    } catch (error) {
      console.error('Error sending email alerts:', error);
    }
  };

  const testEmailService = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/test-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        showNotification(`📧 Test email sent to ${data.data.email}`, 'success');
      } else {
        showNotification(data.message || 'Failed to send test email', 'error');
      }
    } catch (error) {
      showNotification('Error testing email service', 'error');
    }
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const deadline = new Date(endTime);
    const timeDiff = deadline.getTime() - now.getTime();
    
    if (timeDiff <= 0) return 'Overdue';
    
    const hours = Math.floor(timeDiff / (1000 * 3600));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else {
      const minutes = Math.floor(timeDiff / (1000 * 60));
      return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
    }
  };

  const getDeadlineUrgency = (endTime: string) => {
    const now = new Date();
    const deadline = new Date(endTime);
    const timeDiff = deadline.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    if (timeDiff <= 0) return 'overdue';
    if (hoursDiff <= 24) return 'urgent';
    if (hoursDiff <= 72) return 'warning';
    return 'normal';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'class': return '📚';
      case 'assignment': return '📝';
      case 'exam': return '📋';
      case 'study-session': return '🧠';
      case 'personal': return '👤';
      case 'meeting': return '🤝';
      default: return '📅';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600">Please log in to manage your schedule.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Deadline Alerts */}
        {deadlineAlerts.length > 0 && showDeadlineAlerts && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  Upcoming Deadlines
                </h3>
                <div className="flex items-center gap-2">
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    {deadlineAlerts.length} alert{deadlineAlerts.length > 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => sendEmailAlerts(deadlineAlerts)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                    title="Send email alerts"
                  >
                    📧 Email Me
                  </button>
                  <button
                    onClick={testEmailService}
                    className="bg-gray-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-700"
                    title="Test email service"
                  >
                    🧪 Test
                  </button>
                  <button
                    onClick={() => setShowDeadlineAlerts(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Dismiss alerts"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {deadlineAlerts.map((item) => {
                  const urgency = getDeadlineUrgency(item.endTime);
                  const urgencyColors = {
                    overdue: 'bg-red-50 border-red-200 text-red-800',
                    urgent: 'bg-red-50 border-red-200 text-red-800',
                    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
                    normal: 'bg-blue-50 border-blue-200 text-blue-800'
                  };
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border-2 ${urgencyColors[urgency]}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="mr-2">{getTypeIcon(item.type)}</span>
                            <h4 className="font-semibold">{item.title}</h4>
                            {item.course && (
                              <span className="ml-2 text-sm bg-white bg-opacity-50 px-2 py-1 rounded">
                                {item.course}
                              </span>
                            )}
                          </div>
                          <p className="text-sm opacity-75 mb-2">{item.description}</p>
                          <div className="flex items-center text-sm">
                            <span className="mr-4">
                              📅 Due: {formatDate(item.endTime)} at {formatTime(item.endTime)}
                            </span>
                            <span className="font-bold">
                              ⏰ {getTimeRemaining(item.endTime)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          {urgency === 'urgent' && (
                            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                              URGENT
                            </div>
                          )}
                          {urgency === 'warning' && (
                            <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                              WARNING
                            </div>
                          )}
                          {urgency === 'overdue' && (
                            <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                              OVERDUE
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  💡 <strong>Tip:</strong> Click on any deadline to view details or mark as completed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-800">{Math.round(analytics.totalScheduledHours)}h</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-800">{analytics.completedTasks}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Productivity</p>
                  <p className="text-2xl font-bold text-gray-800">{analytics.productivityScore}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-full">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Missed</p>
                  <p className="text-2xl font-bold text-gray-800">{analytics.missedTasks}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Schedule */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📅 Your Schedule</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedView('day')}
                    className={`px-4 py-2 rounded-lg ${selectedView === 'day' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => setSelectedView('week')}
                    className={`px-4 py-2 rounded-lg ${selectedView === 'week' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    ➕ Add Item
                  </button>
                </div>
              </div>

              {/* Schedule Items */}
              <div className="space-y-4">
                {schedule.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">📅</span>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No scheduled items</h3>
                    <p className="text-gray-600">Add your first schedule item to get started!</p>
                  </div>
                ) : (
                  schedule.map((item) => {
                    const isDeadlineItem = item.type === 'assignment' || item.type === 'exam';
                    const urgency = isDeadlineItem ? getDeadlineUrgency(item.endTime) : 'normal';
                    const hasDeadlineWarning = isDeadlineItem && (urgency === 'urgent' || urgency === 'warning' || urgency === 'overdue');
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                          hasDeadlineWarning 
                            ? urgency === 'urgent' || urgency === 'overdue'
                              ? 'border-red-300 bg-red-50' 
                              : 'border-yellow-300 bg-yellow-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">{getTypeIcon(item.type)}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-800">{item.title}</h3>
                                  {hasDeadlineWarning && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                      urgency === 'urgent' || urgency === 'overdue' 
                                        ? 'bg-red-500 text-white animate-pulse' 
                                        : 'bg-yellow-500 text-white'
                                    }`}>
                                      {urgency === 'overdue' ? '⚠️ OVERDUE' : 
                                       urgency === 'urgent' ? '🚨 URGENT' : '⚠️ WARNING'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {formatDate(item.startTime)} • {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                </p>
                                {isDeadlineItem && (
                                  <p className={`text-sm font-medium ${
                                    urgency === 'urgent' || urgency === 'overdue' ? 'text-red-600' :
                                    urgency === 'warning' ? 'text-yellow-600' : 'text-gray-600'
                                  }`}>
                                    ⏰ {getTimeRemaining(item.endTime)}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {item.description && (
                              <p className="text-gray-700 mb-2">{item.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              {item.location && <span>📍 {item.location}</span>}
                              {item.course && <span>📚 {item.course}</span>}
                              {item.professor && <span>👨‍🏫 {item.professor}</span>}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">{item.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Smart Suggestions Sidebar */}
          <div className="space-y-6">
            {/* AI Suggestions */}
            {suggestions && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">🤖 Smart Suggestions</h3>
                
                {/* Study Recommendations */}
                {suggestions.studyRecommendations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-3">📚 Study Recommendations</h4>
                    <div className="space-y-3">
                      {suggestions.studyRecommendations.map((rec, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-blue-800">{rec.subject}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              rec.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-sm text-blue-700 mb-2">{rec.reason}</p>
                          <button
                            onClick={() => createStudySession(rec.subject, rec.reason)}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            Create Study Session
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conflict Alerts */}
                {suggestions.conflictAlerts.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-3">⚠️ Schedule Conflicts</h4>
                    <div className="space-y-2">
                      {suggestions.conflictAlerts.map((conflict, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-800">
                            <strong>{conflict.item1}</strong> conflicts with <strong>{conflict.item2}</strong>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimization Tips */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">💡 Optimization Tips</h4>
                  <div className="space-y-2">
                    {suggestions.optimizationTips.map((tip, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Free Time Slots */}
            {suggestions?.freeTimeSlots && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">⏰ Available Time Slots</h3>
                <div className="space-y-4">
                  {suggestions.freeTimeSlots.map((day, index) => (
                    <div key={index}>
                      <h4 className="font-medium text-gray-700 mb-2">{day.date}</h4>
                      <div className="space-y-2">
                        {day.slots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="bg-gray-50 rounded-lg p-2">
                            <span className="text-sm text-gray-700">
                              {slot.start} - {slot.end} ({slot.duration} min)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Schedule Item Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Create Schedule Item</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={newItem.title}
                      onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={newItem.type}
                      onChange={(e) => setNewItem({...newItem, type: e.target.value as any})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="class">📚 Class</option>
                      <option value="assignment">📝 Assignment</option>
                      <option value="exam">📋 Exam</option>
                      <option value="study-session">🧠 Study Session</option>
                      <option value="personal">👤 Personal</option>
                      <option value="meeting">🤝 Meeting</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                      <input
                        type="datetime-local"
                        value={newItem.startTime}
                        onChange={(e) => setNewItem({...newItem, startTime: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                      <input
                        type="datetime-local"
                        value={newItem.endTime}
                        onChange={(e) => setNewItem({...newItem, endTime: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      placeholder="Enter description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={newItem.location}
                        onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter location..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                      <input
                        type="text"
                        value={newItem.course}
                        onChange={(e) => setNewItem({...newItem, course: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter course code..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Professor</label>
                      <input
                        type="text"
                        value={newItem.professor}
                        onChange={(e) => setNewItem({...newItem, professor: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter professor name..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={newItem.priority}
                        onChange={(e) => setNewItem({...newItem, priority: e.target.value as any})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createScheduleItem}
                      disabled={!newItem.title || !newItem.startTime || !newItem.endTime}
                      className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Create Item
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartScheduleManager;
