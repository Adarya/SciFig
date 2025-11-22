import React from 'react';
import { AppRoutes } from './routes';
import { logger } from './utils/logger';
import { useAuth } from './providers/ApiAuthProvider';
import { useLocation } from 'react-router-dom';

/**
 * Main App component
 * Now uses React Router for navigation instead of state-based routing
 */
function App() {
  const { loading } = useAuth();
  const location = useLocation();

  // Log route changes for debugging
  React.useEffect(() => {
    logger.info('Route changed', { 
      pathname: location.pathname,
      search: location.search
    }, 'App');
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <AppRoutes />
    </div>
  );
}

export default App;