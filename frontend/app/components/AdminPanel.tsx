'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/api';

interface AdminStats {
  totalPolls: number;
  activePolls: number;
  totalVotes: number;
  totalUsers: number;
}

interface Poll {
  _id: string;
  id?: string;
  title: string;
  description: string;
  options: Array<{
    id: string;
    text: string;
    description?: string;
    voteCount: number;
  }>;
  createdAt: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  isAnonymous: boolean;
  category: string;
  totalVotes: number;
}

const AdminPanel: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'polls' | 'create' | 'analytics'>('dashboard');
  const [stats, setStats] = useState<AdminStats>({
    totalPolls: 0,
    activePolls: 0,
    totalVotes: 0,
    totalUsers: 0
  });
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // New poll form state (moved to top to fix hooks order)
  const [newPoll, setNewPoll] = useState({
    title: '',
    description: '',
    category: 'campus-decision',
    isAnonymous: true,
    startTime: '',
    endTime: '',
    options: [
      { text: '', description: '' },
      { text: '', description: '' }
    ]
  });

  // Track if component is mounted (client-side)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check admin authentication (only when mounted)
  useEffect(() => {
    if (!isMounted) return;
    
    console.log('🔍 AdminPanel Auth Check:', { isLoggedIn, user });
    
    // Check localStorage directly as fallback
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : null;
    
    console.log('🔍 localStorage data:', { token: !!token, userData });
    
    if (!isLoggedIn && !token) {
      console.log('❌ No authentication found, redirecting to home');
      window.location.href = '/';
      return;
    }
    
    const currentUser = user || userData;
    if (currentUser && currentUser.role !== 'admin') {
      console.log('❌ Not an admin user, redirecting to home');
      window.location.href = '/';
      return;
    }
    
    console.log('✅ Admin authentication passed');
  }, [user, isLoggedIn, isMounted]);

  // Fetch admin data when user changes
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  // Check localStorage directly for admin access (only in browser)
  const token = isMounted ? localStorage.getItem('token') : null;
  const userStr = isMounted ? localStorage.getItem('user') : null;
  const localUser = userStr ? JSON.parse(userStr) : null;
  
  // Don't render if not mounted yet (prevent SSR issues)
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't render if not authenticated as admin
  if (!isLoggedIn && !token) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Admin privileges required to access this page.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  const currentUser = user || localUser;
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Admin privileges required to access this page.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const getAuthToken = () => {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  };

  const fetchAdminData = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!statsResponse.ok) {
        const errorData = await statsResponse.json();
        throw new Error(errorData.message || `Stats API error: ${statsResponse.status}`);
      }
      
      const statsData = await statsResponse.json();
      console.log('📊 Stats response:', statsData);
      
      if (statsData.success) {
        setStats(statsData.data);
      } else {
        throw new Error(statsData.message || 'Failed to fetch stats');
      }

      // Fetch all polls
      const pollsResponse = await fetch(`${API_BASE_URL}/admin/polls`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!pollsResponse.ok) {
        const errorData = await pollsResponse.json();
        throw new Error(errorData.message || `Polls API error: ${pollsResponse.status}`);
      }
      
      const pollsData = await pollsResponse.json();
      console.log('📋 Polls response:', pollsData);
      
      if (pollsData.success) {
        setPolls(pollsData.data);
      } else {
        throw new Error(pollsData.message || 'Failed to fetch polls');
      }
    } catch (error) {
      console.error('fetchAdminData error:', error);
      showNotification(`Error fetching admin data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const createPoll = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      console.log('🔄 Creating poll:', newPoll);
      
      const response = await fetch(`${API_BASE_URL}/admin/polls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPoll)
      });

      console.log('📝 Create poll response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📝 Create poll response data:', data);
      
      if (data.success) {
        showNotification('Poll created successfully!', 'success');
        setNewPoll({
          title: '',
          description: '',
          category: 'campus-decision',
          isAnonymous: true,
          startTime: '',
          endTime: '',
          options: [
            { text: '', description: '' },
            { text: '', description: '' }
          ]
        });
        fetchAdminData();
        setActiveTab('polls');
      } else {
        throw new Error(data.message || 'Failed to create poll');
      }
    } catch (error) {
      console.error('Create poll error:', error);
      showNotification(`Error creating poll: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const deletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/polls/${pollId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        showNotification('Poll deleted successfully!', 'success');
        fetchAdminData();
      } else {
        showNotification(data.message || 'Failed to delete poll', 'error');
      }
    } catch (error) {
      showNotification('Error deleting poll', 'error');
    }
  };

  const clearAllPolls = async () => {
    if (!confirm('Are you sure you want to delete ALL polls? This action cannot be undone and will remove all polls from the voting system.')) {
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    try {
      // Delete all polls one by one
      for (const poll of polls) {
        const pollId = poll._id || poll.id; // Use _id from MongoDB or fallback to id
        const response = await fetch(`${API_BASE_URL}/admin/polls/${pollId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete poll');
        }
      }
      
      showNotification('All polls cleared successfully!', 'success');
      fetchAdminData();
    } catch (error) {
      console.error('Clear polls error:', error);
      showNotification(`Error clearing polls: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const togglePollStatus = async (pollId: string, isActive: boolean) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/polls/${pollId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      const data = await response.json();
      if (data.success) {
        showNotification(`Poll ${!isActive ? 'activated' : 'deactivated'} successfully!`, 'success');
        fetchAdminData();
      } else {
        showNotification(data.message || 'Failed to update poll status', 'error');
      }
    } catch (error) {
      showNotification('Error updating poll status', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const addOption = () => {
    setNewPoll({
      ...newPoll,
      options: [...newPoll.options, { text: '', description: '' }]
    });
  };

  const removeOption = (index: number) => {
    if (newPoll.options.length > 2) {
      const newOptions = newPoll.options.filter((_, i) => i !== index);
      setNewPoll({ ...newPoll, options: newOptions });
    }
  };

  const updateOption = (index: number, field: string, value: string) => {
    const newOptions = newPoll.options.map((option, i) => 
      i === index ? { ...option, [field]: value } : option
    );
    setNewPoll({ ...newPoll, options: newOptions });
  };

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage polls and voting system</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {user?.firstName || 'Admin'} {user?.lastName || ''}
              </span>
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                {(user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'A').toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {notification.message}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: '📊' },
              { id: 'polls', name: 'Manage Polls', icon: '🗳️' },
              { id: 'create', name: 'Create Poll', icon: '➕' },
              { id: 'analytics', name: 'Analytics', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Polls</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{stats.totalPolls}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">✅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Polls</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{stats.activePolls}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">🗳️</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Votes</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{stats.totalVotes}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{stats.totalUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Polls Tab */}
        {activeTab === 'polls' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">All Polls</h3>
              <div className="flex space-x-3">
                <button
                  onClick={clearAllPolls}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <span>🗑️</span>
                  <span>Clear All Polls</span>
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Create New Poll</span>
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {polls.map((poll) => (
                <div key={poll.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-xl font-semibold text-gray-900">{poll.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          poll.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {poll.isActive ? '🟢 Active' : '🔴 Inactive'}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {poll.category.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{poll.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📊 {poll.totalVotes} votes</span>
                        <span>📅 Created: {new Date(poll.createdAt).toLocaleDateString()}</span>
                        <span>⏰ Ends: {new Date(poll.endTime).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => togglePollStatus(poll._id, poll.isActive)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          poll.isActive 
                            ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {poll.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deletePoll(poll._id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Poll Options */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">Options:</h5>
                    {poll.options.map((option, index) => (
                      <div key={option.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <div>
                          <span className="font-medium">{option.text}</span>
                          {option.description && (
                            <p className="text-sm text-gray-600">{option.description}</p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-indigo-600">
                          {option.voteCount} votes
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Poll Tab */}
        {activeTab === 'create' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Create New Poll</h3>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poll Title *
                  </label>
                  <input
                    type="text"
                    value={newPoll.title}
                    onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter poll title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newPoll.description}
                    onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Describe what this poll is about..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newPoll.category}
                      onChange={(e) => setNewPoll({ ...newPoll, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="student-election">Student Election</option>
                      <option value="campus-decision">Campus Decision</option>
                      <option value="feedback">Feedback</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newPoll.isAnonymous}
                        onChange={(e) => setNewPoll({ ...newPoll, isAnonymous: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Anonymous Voting</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={newPoll.startTime}
                      onChange={(e) => setNewPoll({ ...newPoll, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={newPoll.endTime}
                      onChange={(e) => setNewPoll({ ...newPoll, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Poll Options */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Poll Options * (minimum 2)
                    </label>
                    <button
                      onClick={addOption}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <span>➕</span>
                      <span>Add Option</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newPoll.options.map((option, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h6 className="text-sm font-medium text-gray-700">Option {index + 1}</h6>
                          {newPoll.options.length > 2 && (
                            <button
                              onClick={() => removeOption(index)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(index, 'text', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Option text..."
                          />
                          <input
                            type="text"
                            value={option.description}
                            onChange={(e) => updateOption(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Optional description..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    onClick={() => setActiveTab('polls')}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createPoll}
                    disabled={!newPoll.title || !newPoll.description || !newPoll.startTime || !newPoll.endTime || newPoll.options.some(opt => !opt.text)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Create Poll
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Voting Analytics</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Poll Performance</h4>
                <div className="space-y-4">
                  {polls.slice(0, 5).map((poll) => (
                    <div key={poll.id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 truncate">{poll.title}</p>
                        <p className="text-sm text-gray-500">{poll.totalVotes} votes</p>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((poll.totalVotes / Math.max(...polls.map(p => p.totalVotes))) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h4>
                <div className="space-y-3">
                  {polls.slice(0, 5).map((poll) => (
                    <div key={poll.id} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{poll.title}</p>
                        <p className="text-xs text-gray-500">
                          Created {new Date(poll.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
