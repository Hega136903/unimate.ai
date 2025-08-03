
'use client';

export default function Features() {
  const features = [
    {
      icon: '📅',
      title: 'Smart Schedule Management',
      description: 'AI-powered scheduling that adapts to your academic calendar, tracks assignments, and optimizes your daily routine for maximum productivity.',
      gradient: 'from-purple-500 to-blue-500'
    },
    {
      icon: '🗳️',
      title: 'Digital Campus Voting',
      description: 'Secure, transparent voting system for student elections, polls, and campus decisions with real-time results and blockchain security.',
      gradient: 'from-blue-500 to-teal-500'
    },
    {
      icon: '📋',
      title: 'Student Portfolio Builder',
      description: 'Create stunning digital portfolios showcasing your projects, achievements, and skills with AI-generated insights and career recommendations.',
      gradient: 'from-teal-500 to-purple-500'
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Smart Features for{' '}
            <span className="text-purple-600 dark:text-purple-400 font-extrabold">
              Modern Students
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover how Unimate.AI revolutionizes campus life with intelligent tools designed specifically for Indian college students
          </p>
          <div className="mt-8 w-24 h-1 bg-gradient-to-r from-purple-600 to-teal-500 mx-auto rounded-full"></div>
        </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transform hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-teal-500 rounded-xl flex items-center justify-center mb-6 text-2xl text-white">
                  <span>{feature.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <div className="flex items-center text-purple-600 dark:text-purple-400 font-semibold group-hover:text-teal-500 transition-colors">
                  Learn More <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
