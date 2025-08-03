
'use client';

import { useState, useEffect } from 'react';
import Hero from './components/Hero';
import Features from './components/Features';
import Header from './components/Header';
import Footer from './components/Footer';
import VotingSystem from './components/VotingSystem';
import SmartScheduleManager from './components/SmartScheduleManager';
import StudentPortfolioBuilder from './components/StudentPortfolioBuilder';
import PortfolioDiscovery from './components/PortfolioDiscovery';
import { AuthProvider } from './context/AuthContext';

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState('home'); // Track active section

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <AuthProvider>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
        <Header darkMode={darkMode} setDarkMode={setDarkMode} activeSection={activeSection} setActiveSection={setActiveSection} />
        
        {/* Show different sections based on activeSection */}
        {(activeSection === 'home' || activeSection === 'features') && (
          <>
            <Hero onNavigate={setActiveSection} />
            <Features />
          </>
        )}
        
        {/* Campus Voting System - Only show when voting is active */}
        {activeSection === 'voting' && (
          <section id="voting" className="py-20 bg-blue-50 dark:bg-blue-900/20 min-h-screen">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  🗳️ Campus Voting System
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Participate in campus polls and elections
                </p>
              </div>
              <VotingSystem />
            </div>
          </section>
        )}

        {/* Smart Schedule Management - Only show when schedule is active */}
        {activeSection === 'schedule' && (
          <section id="schedule" className="py-20 bg-purple-50 dark:bg-purple-900/20 min-h-screen">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  📅 Smart Schedule Management
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  AI-powered schedule optimization for students
                </p>
              </div>
              <SmartScheduleManager />
            </div>
          </section>
        )}

        {/* Student Portfolio Builder - Only show when portfolio is active */}
        {activeSection === 'portfolio' && (
          <StudentPortfolioBuilder />
        )}

        {/* Portfolio Discovery - Only show when discovery is active */}
        {activeSection === 'discovery' && (
          <PortfolioDiscovery />
        )}
        
        <Footer />
      </div>
    </AuthProvider>
  );
}
