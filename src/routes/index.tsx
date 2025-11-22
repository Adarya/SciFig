import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import LandingPage from '../components/LandingPage';
import Dashboard from '../components/Dashboard';
import AnalysisWorkflow from '../components/AnalysisWorkflow';
import FigureAnalyzer from '../components/FigureAnalyzer';
import PricingPage from '../components/PricingPage';
import AdminPage from '../components/AdminPage';
import KaplanMeierAnalysis from '../components/KaplanMeierAnalysis';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../providers/ApiAuthProvider';
import AuthModal from '../components/AuthModal';

/**
 * Main routing component that handles all application routes
 * Uses React Router for URL-based navigation
 */
export const AppRoutes: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  // Check for admin access via URL parameter
  useEffect(() => {
    if (searchParams.get('admin') === 'true') {
      // Admin access is handled in the route itself
    }
  }, [searchParams]);

  const handleLogin = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      setAuthModalMode('signup');
      setShowAuthModal(true);
    } else {
      console.log(`Selected plan: ${planId}`);
      // Handle plan selection for logged-in users
    }
  };

  // Redirect to dashboard if user is logged in and on landing page
  const shouldRedirectToDashboard = user && location.pathname === '/';

  return (
    <>
      <Routes>
          {/* Landing page - public */}
          <Route 
            path="/" 
            element={
              shouldRedirectToDashboard ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LandingPage 
                  onLogin={handleLogin} 
                  user={user}
                />
              )
            } 
          />

          {/* Dashboard - protected */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Analysis workflow - public, optional project ID */}
          <Route 
            path="/analysis/:projectId?" 
            element={<AnalysisWorkflow />} 
          />

          {/* Figure analyzer - public, optional project ID */}
          <Route 
            path="/figure-analyzer/:projectId?" 
            element={<FigureAnalyzer />} 
          />

          {/* Pricing page - public */}
          <Route 
            path="/pricing" 
            element={
              <PricingPage 
                onSelectPlan={handleSelectPlan}
              />
            } 
          />

          {/* Admin page - special access via query parameter */}
          <Route 
            path="/admin" 
            element={
              searchParams.get('admin') === 'true' ? (
                <AdminPage />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Kaplan-Meier analysis - public */}
          <Route 
            path="/kaplan-meier" 
            element={<KaplanMeierAnalysis />} 
          />

          {/* Projects list - protected (if needed in future) */}
          {/* <Route 
            path="/projects" 
            element={
              <ProtectedRoute requireAuth={true}>
                <ProjectList />
              </ProtectedRoute>
            } 
          /> */}

          {/* Catch all - redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      {/* Auth Modal - shown when needed */}
      {location.pathname !== '/admin' && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authModalMode}
        />
      )}
    </>
  );
};

