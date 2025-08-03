
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import AdminLoginModal from './AdminLoginModal';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export default function Header({ darkMode, setDarkMode, activeSection, setActiveSection }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const { user, logout, isLoggedIn } = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const handleAdminLogin = () => {
    setShowAdminModal(true);
  };

  const handleNavClick = (section: string) => {
    setActiveSection(section);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
                Unimate.AI
              </Link>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => handleNavClick('home')}
                className={`text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${activeSection === 'home' ? 'text-purple-600 dark:text-purple-400 font-semibold' : ''}`}
              >
                Home
              </button>
              <button 
                onClick={() => handleNavClick('features')}
                className={`text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${activeSection === 'features' ? 'text-purple-600 dark:text-purple-400 font-semibold' : ''}`}
              >
                Features
              </button>
              <button 
                onClick={() => handleNavClick('voting')}
                className={`text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${activeSection === 'voting' ? 'text-purple-600 dark:text-purple-400 font-semibold' : ''}`}
              >
                Voting
              </button>
              <button 
                onClick={() => handleNavClick('schedule')}
                className={`text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${activeSection === 'schedule' ? 'text-purple-600 dark:text-purple-400 font-semibold' : ''}`}
              >
                Schedule
              </button>
              <button 
                onClick={() => handleNavClick('portfolio')}
                className={`text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${activeSection === 'portfolio' ? 'text-purple-600 dark:text-purple-400 font-semibold' : ''}`}
              >
                Portfolio
              </button>
              <button 
                onClick={() => handleNavClick('discovery')}
                className={`text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${activeSection === 'discovery' ? 'text-purple-600 dark:text-purple-400 font-semibold' : ''}`}
              >
                Discover
              </button>
              
              {/* Authentication buttons */}
              {isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Welcome, {user?.firstName}!
                  </span>
                  {/* Admin Panel - Only show for admin users */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => window.location.href = '/admin'}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center space-x-1"
                      title="Access Admin Panel"
                    >
                      <span>⚡</span>
                      <span>Admin Panel</span>
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  {/* Admin Quick Login */}
                  <button
                    onClick={handleAdminLogin}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center space-x-1"
                    title="Admin Login"
                  >
                    <span>🔧</span>
                    <span>Admin Login</span>
                  </button>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-teal-500 text-white px-4 py-2 rounded-md hover:from-purple-700 hover:to-teal-600 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              )}
              
              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Open menu</span>
                {!isMenuOpen ? '☰' : '✕'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => handleNavClick('home')}
                className={`block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 w-full text-left ${activeSection === 'home' ? 'text-purple-600 dark:text-purple-400 font-semibold' : ''}`}
              >
                Home
              </button>
              <button 
                onClick={() => handleNavClick('features')}
                className={`block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 w-full text-left ${activeSection === 'features' ? 'text-purple-600 dark:text-purple-400 font-semibold' : ''}`}
              >
                Features
              </button>
              <button 
                onClick={() => handleNavClick('voting')}
                className={`block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 w-full text-left ${activeSection === 'voting' ? 'text-purple-600 dark:text-purple-400 font-semibold' : ''}`}
              >
                Voting
              </button>
              <button 
                onClick={() => handleNavClick('schedule')}
                className={`block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 w-full text-left ${activeSection === 'schedule' ? 'text-purple-600 dark:text-purple-400 font-semibold' : ''}`}
              >
                Schedule
              </button>
              <button 
                onClick={() => handleNavClick('portfolio')}
                className={`block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 w-full text-left ${activeSection === 'portfolio' ? 'text-purple-600 dark:text-purple-400 font-semibold' : ''}`}
              >
                Portfolio
              </button>
              <button 
                onClick={() => handleNavClick('discovery')}
                className={`block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 w-full text-left ${activeSection === 'discovery' ? 'text-purple-600 dark:text-purple-400 font-semibold' : ''}`}
              >
                Discover
              </button>
              
              {/* Mobile authentication */}
              {isLoggedIn ? (
                <div className="px-3 py-2 space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Welcome, {user?.firstName}!
                  </p>
                  {/* Mobile Admin Panel - Only show for admin users */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        window.location.href = '/admin';
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md bg-green-600 text-white"
                    >
                      ⚡ Admin Panel
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-md text-gray-700 dark:text-gray-300"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="px-3 py-2 space-y-2">
                  {/* Mobile Admin Button */}
                  <button
                    onClick={() => {
                      handleAdminLogin();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md bg-red-600 text-white"
                  >
                    🔧 Admin Login
                  </button>
                  <button
                    onClick={() => {
                      setShowLoginModal(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-gray-700 dark:text-gray-300"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setShowRegisterModal(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md bg-gradient-to-r from-purple-600 to-teal-500 text-white"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Modals */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />
      <RegisterModal 
        isOpen={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </>
  );
}
