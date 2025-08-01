'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../lib/api';

interface Project {
  id?: string;
  title: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  createdAt?: Date;
}

interface Skill {
  id?: string;
  name: string;
  level: number; // 1-100
  category: string;
}

interface Achievement {
  id?: string;
  title: string;
  description: string;
  date: string;
  certificateUrl?: string;
  issuer: string;
}

interface PortfolioData {
  id?: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
    bio: string;
    avatar?: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
  projects: Project[];
  skills: Skill[];
  achievements: Achievement[];
  isPublic: boolean;
  username: string;
}

export default function StudentPortfolioBuilder() {
  const { user, isLoggedIn } = useAuth();
  const [showBuilder, setShowBuilder] = useState(false);
  const [currentSection, setCurrentSection] = useState('profile');
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      bio: '',
      avatar: '',
      website: '',
      linkedin: '',
      github: ''
    },
    projects: [],
    skills: [],
    achievements: [],
    isPublic: false,
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Form states for adding new items
  const [newProject, setNewProject] = useState<Project>({
    title: '',
    description: '',
    techStack: [],
    githubUrl: '',
    liveUrl: '',
    imageUrl: ''
  });

  const [newSkill, setNewSkill] = useState<Skill>({
    name: '',
    level: 50,
    category: ''
  });

  const [newAchievement, setNewAchievement] = useState<Achievement>({
    title: '',
    description: '',
    date: '',
    certificateUrl: '',
    issuer: ''
  });

  useEffect(() => {
    if (isLoggedIn && user) {
      setPortfolioData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email
        },
        username: user.email.split('@')[0]
      }));
      loadPortfolioData();
    }
  }, [isLoggedIn, user]);

  const loadPortfolioData = async () => {
    try {
      const result = await apiService.getPortfolio();
      if (result.success && result.data?.portfolio) {
        setPortfolioData(result.data.portfolio);
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const savePortfolio = async () => {
    try {
      setLoading(true);
      const result = await apiService.updatePortfolio(portfolioData);
      if (result.success) {
        showNotification('success', 'Portfolio saved successfully!');
      } else {
        showNotification('error', result.message || 'Error saving portfolio');
      }
    } catch (error) {
      console.error('Error saving portfolio:', error);
      showNotification('error', 'Error saving portfolio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addProject = async () => {
    if (!newProject.title || !newProject.description) {
      showNotification('error', 'Please fill in title and description');
      return;
    }

    try {
      setLoading(true);
      const projectWithId = { ...newProject, id: Date.now().toString() };
      setPortfolioData(prev => ({
        ...prev,
        projects: [...prev.projects, projectWithId]
      }));
      setNewProject({
        title: '',
        description: '',
        techStack: [],
        githubUrl: '',
        liveUrl: '',
        imageUrl: ''
      });
      showNotification('success', 'Project added successfully!');
    } catch (error) {
      showNotification('error', 'Error adding project');
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = (projectId: string) => {
    setPortfolioData(prev => ({
      ...prev,
      projects: prev.projects.filter(project => project.id !== projectId)
    }));
    showNotification('success', 'Project deleted successfully!');
  };

  const addSkill = async () => {
    if (!newSkill.name || !newSkill.category) {
      showNotification('error', 'Please fill in skill name and category');
      return;
    }

    try {
      const skillWithId = { ...newSkill, id: Date.now().toString() };
      setPortfolioData(prev => ({
        ...prev,
        skills: [...prev.skills, skillWithId]
      }));
      setNewSkill({ name: '', level: 50, category: '' });
      showNotification('success', 'Skill added successfully!');
    } catch (error) {
      showNotification('error', 'Error adding skill');
    }
  };

  const deleteSkill = (skillId: string) => {
    setPortfolioData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== skillId)
    }));
    showNotification('success', 'Skill deleted successfully!');
  };

  const addAchievement = async () => {
    if (!newAchievement.title || !newAchievement.description) {
      showNotification('error', 'Please fill in title and description');
      return;
    }

    try {
      const achievementWithId = { ...newAchievement, id: Date.now().toString() };
      setPortfolioData(prev => ({
        ...prev,
        achievements: [...prev.achievements, achievementWithId]
      }));
      setNewAchievement({
        title: '',
        description: '',
        date: '',
        certificateUrl: '',
        issuer: ''
      });
      showNotification('success', 'Achievement added successfully!');
    } catch (error) {
      showNotification('error', 'Error adding achievement');
    }
  };

  const deleteAchievement = (achievementId: string) => {
    setPortfolioData(prev => ({
      ...prev,
      achievements: prev.achievements.filter(achievement => achievement.id !== achievementId)
    }));
    showNotification('success', 'Achievement deleted successfully!');
  };

  const addTechToProject = (tech: string) => {
    if (tech && !newProject.techStack.includes(tech)) {
      setNewProject(prev => ({
        ...prev,
        techStack: [...prev.techStack, tech]
      }));
    }
  };

  const removeTechFromProject = (tech: string) => {
    setNewProject(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech)
    }));
  };

  // Landing page when not in builder mode
  if (!showBuilder) {
    return (
      <section className="py-20 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-purple-500 p-4 rounded-full mr-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white">
                Student Portfolio Builder
              </h1>
            </div>
            
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Create stunning digital portfolios to showcase your projects, skills, and achievements. 
              Build a professional online presence that stands out to employers and collaborators.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
                <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Showcase Projects</h3>
                <p className="text-gray-300">Display your best work with links to GitHub and live demos</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
                <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Track Skills</h3>
                <p className="text-gray-300">Organize and display your technical skills with progress levels</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
                <div className="bg-yellow-500 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Share Achievements</h3>
                <p className="text-gray-300">Upload certificates and highlight your accomplishments</p>
              </div>
            </div>
            
            {isLoggedIn ? (
              <button
                onClick={() => setShowBuilder(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-10 py-4 rounded-full text-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                Start Building Your Portfolio
              </button>
            ) : (
              <div className="text-gray-400 text-lg">
                Please login to start building your portfolio
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Dashboard with sidebar navigation
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg text-white ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-lg h-screen sticky top-0">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Portfolio Builder</h2>
            <nav className="space-y-2">
              {[
                { id: 'profile', name: 'Profile', icon: '👤' },
                { id: 'projects', name: 'Projects', icon: '🚀' },
                { id: 'skills', name: 'Skills', icon: '💡' },
                { id: 'achievements', name: 'Achievements', icon: '🏆' },
                { id: 'public', name: 'Public Portfolio', icon: '🌐' }
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    currentSection === section.id
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{section.icon}</span>
                  {section.name}
                </button>
              ))}
            </nav>
            
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setShowBuilder(false)}
                className="w-full text-left px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                ← Back to Landing
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Profile Section */}
          {currentSection === 'profile' && (
            <div className="max-w-4xl">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Profile Information</h1>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={portfolioData.personalInfo.fullName}
                      onChange={(e) => setPortfolioData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, fullName: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={portfolioData.personalInfo.email}
                      onChange={(e) => setPortfolioData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, email: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={portfolioData.personalInfo.phone}
                      onChange={(e) => setPortfolioData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, phone: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={portfolioData.personalInfo.location}
                      onChange={(e) => setPortfolioData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, location: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={portfolioData.personalInfo.github}
                      onChange={(e) => setPortfolioData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, github: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={portfolioData.personalInfo.linkedin}
                      onChange={(e) => setPortfolioData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, linkedin: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    value={portfolioData.personalInfo.bio}
                    onChange={(e) => setPortfolioData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, bio: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Professional Summary
                  </label>
                  <textarea
                    rows={3}
                    value={portfolioData.personalInfo.summary}
                    onChange={(e) => setPortfolioData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, summary: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Brief professional summary..."
                  />
                </div>
                
                <div className="mt-6 flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={portfolioData.isPublic}
                      onChange={(e) => setPortfolioData(prev => ({
                        ...prev,
                        isPublic: e.target.checked
                      }))}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Make portfolio public
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Projects Section */}
          {currentSection === 'projects' && (
            <div className="max-w-6xl">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Projects</h1>
              
              {/* Add New Project Form */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Add New Project</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Title
                    </label>
                    <input
                      type="text"
                      value={newProject.title}
                      onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={newProject.githubUrl}
                      onChange={(e) => setNewProject(prev => ({ ...prev, githubUrl: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Live Demo URL
                    </label>
                    <input
                      type="url"
                      value={newProject.liveUrl}
                      onChange={(e) => setNewProject(prev => ({ ...prev, liveUrl: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={newProject.imageUrl}
                      onChange={(e) => setNewProject(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tech Stack
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {newProject.techStack.map((tech, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm"
                      >
                        {tech}
                        <button
                          onClick={() => removeTechFromProject(tech)}
                          className="ml-1 text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add technology"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          addTechToProject(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <button
                  onClick={addProject}
                  disabled={loading}
                  className="mt-6 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Project'}
                </button>
              </div>
              
              {/* Projects List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolioData.projects.map((project) => (
                  <div key={project.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    {project.imageUrl && (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {project.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.techStack.map((tech, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {project.githubUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 dark:text-purple-400 hover:underline text-sm"
                          >
                            GitHub
                          </a>
                        )}
                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 dark:text-purple-400 hover:underline text-sm"
                          >
                            Live Demo
                          </a>
                        )}
                        <button
                          onClick={() => deleteProject(project.id!)}
                          className="text-red-600 dark:text-red-400 hover:underline text-sm ml-auto"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Section */}
          {currentSection === 'skills' && (
            <div className="max-w-4xl">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Skills</h1>
              
              {/* Add New Skill Form */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Add New Skill</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Skill Name
                    </label>
                    <input
                      type="text"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={newSkill.category}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select category</option>
                      <option value="Programming Languages">Programming Languages</option>
                      <option value="Frameworks">Frameworks</option>
                      <option value="Tools">Tools</option>
                      <option value="Databases">Databases</option>
                      <option value="Soft Skills">Soft Skills</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Proficiency Level ({newSkill.level}%)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={newSkill.level}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                </div>
                
                <button
                  onClick={addSkill}
                  className="mt-6 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Skill
                </button>
              </div>
              
              {/* Skills List */}
              <div className="space-y-6">
                {Object.entries(portfolioData.skills.reduce((acc, skill) => {
                  if (!acc[skill.category]) acc[skill.category] = [];
                  acc[skill.category].push(skill);
                  return acc;
                }, {} as Record<string, Skill[]>)).map(([category, skills]) => (
                  <div key={category} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{category}</h3>
                    <div className="space-y-4">
                      {skills.map((skill) => (
                        <div key={skill.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-700 dark:text-gray-300">{skill.name}</span>
                              <span className="text-gray-500 dark:text-gray-400 text-sm">{skill.level}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${skill.level}%` }}
                              ></div>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteSkill(skill.id!)}
                            className="ml-4 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements Section */}
          {currentSection === 'achievements' && (
            <div className="max-w-4xl">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Achievements</h1>
              
              {/* Add New Achievement Form */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Add New Achievement</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newAchievement.title}
                      onChange={(e) => setNewAchievement(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Issuer
                    </label>
                    <input
                      type="text"
                      value={newAchievement.issuer}
                      onChange={(e) => setNewAchievement(prev => ({ ...prev, issuer: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newAchievement.date}
                      onChange={(e) => setNewAchievement(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Certificate URL
                    </label>
                    <input
                      type="url"
                      value={newAchievement.certificateUrl}
                      onChange={(e) => setNewAchievement(prev => ({ ...prev, certificateUrl: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={newAchievement.description}
                    onChange={(e) => setNewAchievement(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <button
                  onClick={addAchievement}
                  className="mt-6 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Achievement
                </button>
              </div>
              
              {/* Achievements List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {portfolioData.achievements.map((achievement) => (
                  <div key={achievement.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg">
                        <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <button
                        onClick={() => deleteAchievement(achievement.id!)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                      >
                        Delete
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {achievement.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      {achievement.issuer} • {achievement.date}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {achievement.description}
                    </p>
                    {achievement.certificateUrl && (
                      <a
                        href={achievement.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 dark:text-purple-400 hover:underline text-sm"
                      >
                        View Certificate
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Public Portfolio Preview */}
          {currentSection === 'public' && (
            <div className="max-w-4xl">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Public Portfolio Preview</h1>
                <button
                  onClick={savePortfolio}
                  disabled={loading}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Portfolio'}
                </button>
              </div>
              
              {portfolioData.isPublic ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {portfolioData.personalInfo.fullName}
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                      {portfolioData.personalInfo.summary}
                    </p>
                    <div className="flex justify-center gap-4">
                      {portfolioData.personalInfo.github && (
                        <a href={portfolioData.personalInfo.github} className="text-purple-600 hover:underline">
                          GitHub
                        </a>
                      )}
                      {portfolioData.personalInfo.linkedin && (
                        <a href={portfolioData.personalInfo.linkedin} className="text-purple-600 hover:underline">
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-8 text-center">
                    {portfolioData.personalInfo.bio}
                  </p>
                  
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    Portfolio URL: {typeof window !== 'undefined' ? window.location.origin : ''}/u/{portfolioData.username}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-300">
                    Your portfolio is currently private. Enable "Make portfolio public" in the Profile section to share it.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
