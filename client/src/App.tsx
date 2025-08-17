import { useState, useEffect } from 'react';
import './App.css';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import type { User } from '../../server/src/schema';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored authentication on app load
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const storedUser = localStorage.getItem('wedding_studio_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('wedding_studio_user');
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to show the professional loading experience
    setTimeout(checkAuthStatus, 800);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      // User is already logged in, no need to show auth modal
      return;
    }
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    // Store user data in localStorage for persistence
    localStorage.setItem('wedding_studio_user', JSON.stringify(userData));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('wedding_studio_user');
  };

  // Loading screen with wedding theme
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#7B1E3A] to-[#A52A2A] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-white animate-pulse"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          
          <h1 className="font-poppins text-2xl font-bold text-gray-900 mb-2">
            Wedding Invite Studio
          </h1>
          
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-[#7B1E3A] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[#7B1E3A] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-[#7B1E3A] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          
          <p className="text-gray-600 text-sm mt-4">
            Creating beautiful wedding experiences...
          </p>
        </div>
      </div>
    );
  }

  // Show dashboard if user is logged in
  if (user) {
    return (
      <Dashboard 
        user={user} 
        onLogout={handleLogout}
      />
    );
  }

  // Show landing page for non-authenticated users
  return (
    <>
      <LandingPage onGetStarted={handleGetStarted} />
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}

export default App;