'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface PollOption {
  id: string;
  text: string;
  description?: string;
  voteCount: number;
  percentage?: number;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  createdAt: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  isAnonymous: boolean;
  category: string;
  totalVotes: number;
  userHasVoted?: boolean;
  timeRemaining?: number;
  canVote?: boolean;
  userSelection?: string;
}

interface VoteResult {
  poll: {
    id: string;
    title: string;
    description: string;
    totalVotes: number;
    endTime: string;
    isActive: boolean;
  };
  options: PollOption[];
  userVoted: boolean;
  userSelection: string | null;
}

const VotingSystem: React.FC = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [showResults, setShowResults] = useState<{ [key: string]: VoteResult }>({});
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Helper function to get auth token
  const getAuthToken = () => {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  };

  useEffect(() => {
    if (user) {
      fetchActivePolls();
    }
  }, [user]);

  const fetchActivePolls = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/voting/polls/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setPolls(data.data);
      } else {
        showNotification(data.message || 'Failed to fetch polls', 'error');
      }
    } catch (error) {
      showNotification('Error fetching polls', 'error');
    } finally {
      setLoading(false);
    }
  };

  const castVote = async (pollId: string, optionId: string) => {
    const token = getAuthToken();
    if (!user || !token) return;

    setVoting(true);
    try {
      const response = await fetch('http://localhost:5000/api/voting/vote', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pollId, optionId }),
      });

      const data = await response.json();
      if (data.success) {
        showNotification(`Vote cast successfully for "${data.data.selectedOption}"!`, 'success');
        // Refresh polls to update vote status
        await fetchActivePolls();
        // Fetch results for this poll
        await fetchPollResults(pollId);
        setSelectedPoll(null);
        setSelectedOption('');
      } else {
        showNotification(data.message || 'Failed to cast vote', 'error');
      }
    } catch (error) {
      showNotification('Error casting vote', 'error');
    } finally {
      setVoting(false);
    }
  };

  const fetchPollResults = async (pollId: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/voting/polls/${pollId}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setShowResults(prev => ({
          ...prev,
          [pollId]: data.data
        }));
      }
    } catch (error) {
      showNotification('Error fetching results', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatTimeRemaining = (milliseconds: number) => {
    if (milliseconds <= 0) return 'Voting closed';
    
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} days, ${hours} hours remaining`;
    if (hours > 0) return `${hours} hours, ${minutes} minutes remaining`;
    return `${minutes} minutes remaining`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'student-election': return '🗳️';
      case 'campus-decision': return '🏫';
      case 'feedback': return '💬';
      default: return '📊';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'student-election': return 'bg-blue-100 text-blue-800';
      case 'campus-decision': return 'bg-green-100 text-green-800';
      case 'feedback': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600">Please log in to participate in campus voting.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading polls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
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

        {/* Polls Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {polls.map((poll) => (
            <div key={poll.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              {/* Poll Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(poll.category)}`}>
                      {getCategoryIcon(poll.category)} {poll.category.replace('-', ' ')}
                    </span>
                    {poll.userHasVoted && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        ✅ Voted
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{poll.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{poll.description}</p>
                </div>
              </div>

              {/* Poll Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>📊 {poll.totalVotes} votes</span>
                <span>⏰ {poll.timeRemaining && formatTimeRemaining(poll.timeRemaining)}</span>
              </div>

              {/* Vote Button or Results */}
              <div className="space-y-3">
                {!poll.userHasVoted && poll.canVote ? (
                  <button
                    onClick={() => setSelectedPoll(poll)}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    🗳️ Cast Your Vote
                  </button>
                ) : (
                  <button
                    onClick={() => fetchPollResults(poll.id)}
                    className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    📊 View Results
                  </button>
                )}
              </div>

              {/* Results Display */}
              {showResults[poll.id] && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Results:</h4>
                  <div className="space-y-2">
                    {showResults[poll.id].options.map((option) => (
                      <div key={option.id} className="relative">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-sm ${
                            showResults[poll.id].userSelection === option.id ? 'font-bold text-indigo-600' : 'text-gray-700'
                          }`}>
                            {option.text}
                            {showResults[poll.id].userSelection === option.id && ' ✅'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {option.percentage}% ({option.voteCount})
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              showResults[poll.id].userSelection === option.id ? 'bg-indigo-600' : 'bg-gray-400'
                            }`}
                            style={{ width: `${option.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {polls.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🗳️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Active Polls</h3>
            <p className="text-gray-600">Check back later for new voting opportunities!</p>
          </div>
        )}

        {/* Voting Modal */}
        {selectedPoll && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Cast Your Vote</h2>
                  <button
                    onClick={() => {
                      setSelectedPoll(null);
                      setSelectedOption('');
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{selectedPoll.title}</h3>
                  <p className="text-gray-600 mb-4">{selectedPoll.description}</p>
                  
                  {selectedPoll.isAnonymous && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <span className="text-blue-800 text-sm">🔒 This is an anonymous vote. Your identity will not be recorded.</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {selectedPoll.options.map((option) => (
                    <label key={option.id} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="voteOption"
                        value={option.id}
                        checked={selectedOption === option.id}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="mt-1 h-4 w-4 text-indigo-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{option.text}</div>
                        {option.description && (
                          <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedPoll(null);
                      setSelectedOption('');
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => castVote(selectedPoll.id, selectedOption)}
                    disabled={!selectedOption || voting}
                    className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {voting ? 'Casting Vote...' : 'Confirm Vote'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingSystem;
