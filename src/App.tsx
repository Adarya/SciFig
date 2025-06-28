import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AnalysisWorkflow from './components/AnalysisWorkflow';
import FigureAnalyzer from './components/FigureAnalyzer';

type AppState = 'landing' | 'dashboard' | 'analysis' | 'figure-analyzer';

function App() {
  const [currentView, setCurrentView] = useState<AppState>('landing');
  const [user, setUser] = useState<any>(null);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('landing');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onLogin={handleLogin} onNavigate={setCurrentView} />;
      case 'dashboard':
        return <Dashboard user={user} onNavigate={setCurrentView} onLogout={handleLogout} />;
      case 'analysis':
        return <AnalysisWorkflow onNavigate={setCurrentView} />;
      case 'figure-analyzer':
        return <FigureAnalyzer onNavigate={setCurrentView} />;
      default:
        return <LandingPage onLogin={handleLogin} onNavigate={setCurrentView} />;
    }
  };

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
    </div>
  );
}

export default App;