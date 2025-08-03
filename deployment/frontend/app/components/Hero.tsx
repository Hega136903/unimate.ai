
'use client';

import { useState, useEffect } from 'react';

interface HeroProps {
  onNavigate?: (section: string) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const fullText = 'Empowering smarter student life on campus';

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isTyping) {
      if (currentText.length < fullText.length) {
        timeoutId = setTimeout(() => {
          setCurrentText(fullText.slice(0, currentText.length + 1));
        }, 100);
      } else {
        setIsTyping(false);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [currentText, isTyping, fullText]);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20futuristic%20university%20campus%20with%20students%20using%20tablets%20and%20laptops%2C%20AI%20technology%20visualization%2C%20holographic%20displays%2C%20clean%20minimalist%20architecture%2C%20bright%20daylight%2C%20vibrant%20purple%20and%20teal%20color%20accents%2C%20digital%20interfaces%20floating%20in%20air%2C%20tech-savvy%20college%20environment%2C%20sleek%20modern%20buildings&width=1920&height=1080&seq=hero-bg&orientation=landscape')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 via-blue-900/70 to-teal-900/80"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-slide-up">
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">
              Unimate.AI
            </span>
          </h1>
          
          <div className="text-xl md:text-2xl text-gray-200 mb-12 h-8 animate-slide-up-delay">
            <span className="border-r-2 border-teal-400 pr-1">
              {currentText}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay">
          <button 
            onClick={() => onNavigate?.('voting')}
            className="bg-gradient-to-r from-purple-600 to-teal-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-700 hover:to-teal-600 transition-all duration-300 hover:shadow-2xl hover:scale-105 whitespace-nowrap"
          >
            Try Voting
          </button>
          <button 
            onClick={() => onNavigate?.('schedule')}
            className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-purple-600 transition-all duration-300 hover:shadow-2xl hover:scale-105 whitespace-nowrap"
          >
            Manage Schedule
          </button>
          <button 
            onClick={() => onNavigate?.('portfolio')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:shadow-2xl hover:scale-105 whitespace-nowrap"
          >
            Build Portfolio
          </button>
        </div>

        <div className="mt-16 animate-bounce">
          <div className="w-8 h-8 flex items-center justify-center mx-auto">
            <i className="ri-arrow-down-line text-white text-2xl"></i>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-900 to-transparent"></div>
    </section>
  );
}
