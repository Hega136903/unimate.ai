'use client';

import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIResponse {
  success: boolean;
  message: string;
  data?: {
    userMessage: string;
    aiResponse: string;
    timestamp: string;
  };
}

export default function AIChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    // Fetch chat history if authenticated
    if (token) {
      (async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/ai/chat/history`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await res.json();
          if (data?.success && data?.data?.messages) {
            const loaded: Message[] = data.data.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.timestamp)
            }));
            if (loaded.length > 0) {
              setMessages(loaded);
              return;
            }
          }
          // Default greeting if no history
          setMessages([
            {
              id: '1',
              role: 'assistant',
              content: 'Hello! I\'m your AI study assistant. I can help you with questions, create study sessions, summarize content, and provide personalized learning recommendations. How can I help you today?',
              timestamp: new Date()
            }
          ]);
        } catch (e) {
          console.error('Failed to load chat history', e);
          setMessages([
            {
              id: '1',
              role: 'assistant',
              content: 'Hello! I\'m your AI study assistant. I can help you with questions, create study sessions, summarize content, and provide personalized learning recommendations. How can I help you today?',
              timestamp: new Date()
            }
          ]);
        }
      })();
    } else {
      // Not authenticated: show info message only
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Please log in to use the AI assistant. Once logged in, your chat history will be saved.',
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    if (!isAuthenticated) {
      alert('Please log in to use the AI assistant.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationHistory: messages.slice(-10) // Send last 10 messages for context
        })
      });

      const data: AIResponse = await response.json();

      if (data.success && data.data) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.aiResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.message || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_BASE_URL}/ai/chat/history`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.warn('Failed to clear server history, clearing local only', e);
    } finally {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Chat cleared! How can I help you today?',
          timestamp: new Date()
        }
      ]);
    }
  };

  const quickPrompts = [
    'Help me study for my exam',
    'Create a study schedule',
    'Explain a difficult concept',
    'Generate practice questions',
    'Summarize my notes'
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🤖 AI Study Assistant
            </h2>
            <p className="text-blue-100 mt-1">
              Powered by advanced AI to help you learn better
            </p>
          </div>
          <button
            onClick={clearChat}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all duration-200"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Authentication Warning */}
      {!isAuthenticated && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Please log in to access the AI assistant functionality.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="h-96 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {isAuthenticated && (
        <div className="px-6 py-2">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleQuickPrompt(prompt)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-6">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isAuthenticated 
                  ? "Ask me anything about your studies..."
                  : "Please log in to use the AI assistant"
              }
              disabled={!isAuthenticated || isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
              rows={2}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!isAuthenticated || !inputMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending
              </>
            ) : (
              <>
                Send
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Features Info */}
      <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">AI Features Available:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="text-blue-500">📚</span> Study Sessions
          </div>
          <div className="flex items-center gap-1">
            <span className="text-green-500">📝</span> Content Summary
          </div>
          <div className="flex items-center gap-1">
            <span className="text-purple-500">🎯</span> Recommendations
          </div>
          <div className="flex items-center gap-1">
            <span className="text-orange-500">❓</span> Q&A Support
          </div>
        </div>
      </div>
    </div>
  );
}
