import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AnalysisWorkflow from './components/AnalysisWorkflow';
import FigureAnalyzer from './components/FigureAnalyzer';
import PricingPage from './components/PricingPage';
import AuthModal from './components/AuthModal';
import { useAuth } from './hooks/useAuth';

type AppState = 'landing' | 'dashboard' | 'analysis' | 'figure-analyzer' | 'pricing';

function App() {
  const [currentView, setCurrentView] = useState<AppState>('landing');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const { user, loading, signOut } = useAuth();

  // Redirect to dashboard if user is logged in and on landing page
  useEffect(() => {
    if (user && currentView === 'landing') {
      setCurrentView('dashboard');
    }
  }, [user, currentView]);

  const handleLogin = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setCurrentView('landing');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      // If not logged in, show signup modal
      setAuthModalMode('signup');
      setShowAuthModal(true);
    } else {
      // Handle plan selection for logged-in users
      console.log(`Selected plan: ${planId}`);
      // Here you would integrate with your payment processor
      // For now, just redirect to dashboard
      setCurrentView('dashboard');
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return (
          <LandingPage 
            onLogin={handleLogin} 
            onNavigate={setCurrentView}
            user={user}
          />
        );
      case 'dashboard':
        return user ? (
          <Dashboard 
            user={user} 
            onNavigate={setCurrentView} 
            onLogout={handleLogout} 
          />
        ) : (
          <LandingPage 
            onLogin={handleLogin} 
            onNavigate={setCurrentView}
            user={user}
          />
        );
      case 'analysis':
        return user ? (
          <AnalysisWorkflow onNavigate={setCurrentView} />
        ) : (
          <LandingPage 
            onLogin={handleLogin} 
            onNavigate={setCurrentView}
            user={user}
          />
        );
      case 'figure-analyzer':
        return <FigureAnalyzer onNavigate={setCurrentView} />;
      case 'pricing':
        return (
          <PricingPage 
            onNavigate={setCurrentView}
            onSelectPlan={handleSelectPlan}
          />
        );
      default:
        return (
          <LandingPage 
            onLogin={handleLogin} 
            onNavigate={setCurrentView}
            user={user}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderCurrentView()}
        </motion.div>
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

export default App;