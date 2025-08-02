// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'admin' | 'faculty';
  university: string;
  studentId?: string;
  department?: string;
  year?: number;
  preferences?: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
  };
  aiUsage?: {
    questionsAsked: number;
    studySessionsCreated: number;
    lastUsed?: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  university: string;
  role?: string;
  studentId?: string;
  department?: string;
  year?: number;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'An error occurred');
    }
    
    return data;
  }

  // Authentication endpoints
  async register(userData: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    
    const result = await this.handleResponse<{ user: User; token: string }>(response);
    
    // Store token in localStorage if registration successful
    if (result.success && result.data?.token) {
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }
    
    return result;
  }

  async login(credentials: LoginData): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(credentials),
    });
    
    const result = await this.handleResponse<{ user: User; token: string }>(response);
    
    // Store token in localStorage if login successful
    if (result.success && result.data?.token) {
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }
    
    return result;
  }

  async logout(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    
    // Clear local storage regardless of response
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    return this.handleResponse(response);
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<{ user: User }>(response);
  }

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    
    const result = await this.handleResponse<{ user: User }>(response);
    
    // Update local storage if successful
    if (result.success && result.data?.user) {
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }
    
    return result;
  }

  // AI endpoints
  async askAI(question: string, context?: string): Promise<ApiResponse<{ answer: string; timestamp: string }>> {
    const response = await fetch(`${API_BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ question, context }),
    });
    
    return this.handleResponse<{ answer: string; timestamp: string }>(response);
  }

  async getAIRecommendations(): Promise<ApiResponse<{ 
    studyTips: string[]; 
    courseRecommendations: string[]; 
    scheduleOptimizations: string[]; 
  }>> {
    const response = await fetch(`${API_BASE_URL}/ai/recommendations`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Student endpoints
  async getStudentData(): Promise<ApiResponse<{
    courses: any[];
    schedules: any[];
    grades: any[];
  }>> {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Analytics endpoints
  async getDashboardAnalytics(): Promise<ApiResponse<{
    totalUsers: number;
    activeUsers: number;
    aiQuestionsAsked: number;
    studySessionsCreated: number;
    popularFeatures: string[];
  }>> {
    const response = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{
    status: string;
    message: string;
    timestamp: string;
    version: string;
  }>> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return this.handleResponse(response);
  }

  // Portfolio endpoints
  async createPortfolio(portfolioData: any): Promise<ApiResponse<{ portfolio: any }>> {
    const response = await fetch(`${API_BASE_URL}/portfolio`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(portfolioData),
    });
    
    return this.handleResponse<{ portfolio: any }>(response);
  }

  async getPortfolio(): Promise<ApiResponse<{ portfolio: any }>> {
    const response = await fetch(`${API_BASE_URL}/portfolio`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<{ portfolio: any }>(response);
  }

  async updatePortfolio(portfolioData: any): Promise<ApiResponse<{ portfolio: any }>> {
    const response = await fetch(`${API_BASE_URL}/portfolio`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(portfolioData),
    });
    
    return this.handleResponse<{ portfolio: any }>(response);
  }

  async deletePortfolio(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/portfolio`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Public portfolio methods
  async getPublicPortfolio(username: string): Promise<ApiResponse<{ portfolio: any }>> {
    const response = await fetch(`${API_BASE_URL}/portfolio/public/${username}`, {
      method: 'GET',
    });
    
    return this.handleResponse<{ portfolio: any }>(response);
  }

  async getAllPublicPortfolios(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/portfolio/public?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
    
    return this.handleResponse(response);
  }

  // Project management methods
  async addProject(projectData: any): Promise<ApiResponse<{ project: any }>> {
    const response = await fetch(`${API_BASE_URL}/portfolio/projects`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(projectData),
    });
    
    return this.handleResponse<{ project: any }>(response);
  }

  async updateProject(projectId: string, projectData: any): Promise<ApiResponse<{ project: any }>> {
    const response = await fetch(`${API_BASE_URL}/portfolio/projects/${projectId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(projectData),
    });
    
    return this.handleResponse<{ project: any }>(response);
  }

  async deleteProject(projectId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/portfolio/projects/${projectId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Skill management methods
  async addSkill(skillData: any): Promise<ApiResponse<{ skill: any }>> {
    const response = await fetch(`${API_BASE_URL}/portfolio/skills`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(skillData),
    });
    
    return this.handleResponse<{ skill: any }>(response);
  }

  async deleteSkill(skillId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/portfolio/skills/${skillId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Achievement management methods
  async addAchievement(achievementData: any): Promise<ApiResponse<{ achievement: any }>> {
    const response = await fetch(`${API_BASE_URL}/portfolio/achievements`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(achievementData),
    });
    
    return this.handleResponse<{ achievement: any }>(response);
  }

  async deleteAchievement(achievementId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/portfolio/achievements/${achievementId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Demo endpoints
  async tryDemo(demoType: string): Promise<ApiResponse<{ demo: any }>> {
    const response = await fetch(`${API_BASE_URL}/demo/${demoType}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ demoType }),
    });
    
    return this.handleResponse<{ demo: any }>(response);
  }

  // Voting endpoints
  async getActivePolls(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/voting/polls/active`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async getPollDetails(pollId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/voting/polls/${pollId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async castVote(pollId: string, optionId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/voting/vote`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ pollId, optionId }),
    });
    
    return this.handleResponse(response);
  }

  async getPollResults(pollId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/voting/polls/${pollId}/results`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createPoll(pollData: {
    title: string;
    description: string;
    options: string[];
    startTime: string;
    endTime: string;
    isAnonymous?: boolean;
    category?: string;
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/voting/polls`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(pollData),
    });
    
    return this.handleResponse(response);
  }

  // Schedule management endpoints
  async getSchedule(startDate?: string, endDate?: string, type?: string): Promise<ApiResponse<any>> {
    let url = `${API_BASE_URL}/schedule`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (type) params.append('type', type);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createScheduleItem(itemData: {
    title: string;
    description?: string;
    type: string;
    startTime: string;
    endTime: string;
    location?: string;
    course?: string;
    professor?: string;
    priority?: string;
    color?: string;
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/schedule/items`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(itemData),
    });
    
    return this.handleResponse(response);
  }

  async updateScheduleItem(itemId: string, updates: any): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/schedule/items/${itemId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    
    return this.handleResponse(response);
  }

  async deleteScheduleItem(itemId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/schedule/items/${itemId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async getSmartSuggestions(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/schedule/suggestions`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createStudySession(sessionData: {
    subject: string;
    topic: string;
    duration: number;
    goals?: string[];
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/schedule/study-sessions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(sessionData),
    });
    
    return this.handleResponse(response);
  }

  async getScheduleAnalytics(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/schedule/analytics`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};

// Helper function to get current user from localStorage
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};
