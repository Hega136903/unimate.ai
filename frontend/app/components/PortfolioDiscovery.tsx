'use client';

import { useState, useEffect } from 'react';
import { apiService } from '../lib/api';

interface PublicPortfolio {
  fullName: string;
  summary: string;
  username: string;
  avatar?: string;
}

interface PortfolioData {
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
  projects: Array<{
    id?: string;
    title: string;
    description: string;
    techStack: string[];
    githubUrl?: string;
    liveUrl?: string;
    imageUrl?: string;
    createdAt?: Date;
  }>;
  skills: Array<{
    id?: string;
    name: string;
    level: number;
    category: string;
  }>;
  achievements: Array<{
    id?: string;
    title: string;
    description: string;
    date: string;
    certificateUrl?: string;
    issuer: string;
  }>;
  isPublic: boolean;
  username: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Pagination {
  current: number;
  pages: number;
  total: number;
}

const PortfolioDiscovery = () => {
  const [portfolios, setPortfolios] = useState<PublicPortfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ current: 1, pages: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'gallery' | 'detail'>('gallery');

  useEffect(() => {
    fetchPublicPortfolios();
  }, [currentPage]);

  const fetchPublicPortfolios = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllPublicPortfolios(currentPage, 12);
      
      if (response.success && response.data) {
        setPortfolios(response.data.portfolios || []);
        setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
      } else {
        setError('Failed to fetch portfolios');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching portfolios');
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioDetails = async (username: string) => {
    try {
      setLoading(true);
      const response = await apiService.getPublicPortfolio(username);
      
      if (response.success && response.data) {
        setSelectedPortfolio(response.data.portfolio);
        setViewMode('detail');
      } else {
        setError('Failed to fetch portfolio details');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching portfolio details');
    } finally {
      setLoading(false);
    }
  };

  const filteredPortfolios = portfolios.filter(portfolio =>
    portfolio.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    portfolio.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderPortfolioCard = (portfolio: PublicPortfolio) => (
    <div
      key={portfolio.username}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
      onClick={() => fetchPortfolioDetails(portfolio.username)}
    >
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {portfolio.avatar ? (
              <img 
                src={portfolio.avatar} 
                alt={portfolio.fullName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              portfolio.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{portfolio.fullName}</h3>
            <p className="text-sm text-gray-600">@{portfolio.username}</p>
          </div>
        </div>
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
          {portfolio.summary || 'No summary available'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-blue-600 text-sm font-medium hover:text-blue-700">
            View Portfolio →
          </span>
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-gray-500">Public</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPortfolioDetail = () => {
    if (!selectedPortfolio) return null;

    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <button
            onClick={() => {
              setViewMode('gallery');
              setSelectedPortfolio(null);
            }}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Gallery
          </button>
          
          <div className="flex items-center space-x-6 mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {selectedPortfolio.personalInfo.avatar ? (
                <img 
                  src={selectedPortfolio.personalInfo.avatar} 
                  alt={selectedPortfolio.personalInfo.fullName}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                selectedPortfolio.personalInfo.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedPortfolio.personalInfo.fullName}
              </h1>
              <p className="text-gray-600 mb-2">@{selectedPortfolio.username}</p>
              <p className="text-lg text-gray-700">{selectedPortfolio.personalInfo.summary}</p>
            </div>
          </div>

          {selectedPortfolio.personalInfo.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-gray-700">{selectedPortfolio.personalInfo.bio}</p>
            </div>
          )}

          {/* Contact Links */}
          <div className="flex flex-wrap gap-4">
            {selectedPortfolio.personalInfo.website && (
              <a
                href={selectedPortfolio.personalInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                </svg>
                <span>Website</span>
              </a>
            )}
            {selectedPortfolio.personalInfo.github && (
              <a
                href={selectedPortfolio.personalInfo.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                <span>GitHub</span>
              </a>
            )}
            {selectedPortfolio.personalInfo.linkedin && (
              <a
                href={selectedPortfolio.personalInfo.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                </svg>
                <span>LinkedIn</span>
              </a>
            )}
          </div>
        </div>

        {/* Projects Section */}
        {selectedPortfolio.projects.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Projects</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {selectedPortfolio.projects.map((project, index) => (
                <div key={project.id || index} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-gray-700 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.techStack.map((tech, techIndex) => (
                      <span key={techIndex} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-4">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        GitHub →
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        Live Demo →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Section */}
        {selectedPortfolio.skills.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {selectedPortfolio.skills.map((skill, index) => (
                <div key={skill.id || index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                    <span className="text-sm text-gray-600">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{skill.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Section */}
        {selectedPortfolio.achievements.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Achievements</h2>
            <div className="space-y-4">
              {selectedPortfolio.achievements.map((achievement, index) => (
                <div key={achievement.id || index} className="border-l-4 border-yellow-400 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{achievement.title}</h3>
                      <p className="text-gray-700 mb-2">{achievement.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Issued by: {achievement.issuer}</span>
                        <span>Date: {achievement.date}</span>
                      </div>
                    </div>
                    {achievement.certificateUrl && (
                      <a
                        href={achievement.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium ml-4"
                      >
                        View Certificate →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (viewMode === 'detail') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderPortfolioDetail()
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Student Portfolio Gallery</h1>
          <p className="text-lg text-gray-600 mb-8">
            Discover amazing portfolios from talented students around the world
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search portfolios..."
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg
                className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Portfolio Grid */}
            {filteredPortfolios.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {filteredPortfolios.map(renderPortfolioCard)}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg ${
                          currentPage === page
                            ? 'text-white bg-blue-600 border border-blue-600'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                      disabled={currentPage === pagination.pages}
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolios found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Be the first to create a public portfolio!'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PortfolioDiscovery;
