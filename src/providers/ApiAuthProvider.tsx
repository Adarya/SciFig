import React, { createContext, useContext, ReactNode } from 'react';
import { useApiAuth } from '../hooks/useApiAuth';
import { User } from '../services/apiClient';

// Define the context type
interface ApiAuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name?: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (updates: { name?: string }) => Promise<User>;
  checkSession: () => Promise<void>;
  getLimits: () => Promise<{
    analyses_remaining: number;
    figures_remaining: number;
    storage_used: number;
    storage_limit: number;
  }>;
}

// Create the context with a default value
const ApiAuthContext = createContext<ApiAuthContextType | undefined>(undefined);

// Provider component
export const ApiAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useApiAuth();
  
  return (
    <ApiAuthContext.Provider value={auth}>
      {children}
    </ApiAuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): ApiAuthContextType => {
  const context = useContext(ApiAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an ApiAuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAuth: boolean } = { requireAuth: true }
) => {
  return (props: P) => {
    const { user, loading } = useAuth();
    
    // If loading, show loading state
    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    // If auth is required but user is not authenticated, redirect to login
    if (options.requireAuth && !user) {
      // In a real app, you would redirect to login page
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p>Please log in to access this page.</p>
        </div>
      );
    }
    
    // Otherwise, render the component
    return <Component {...props} />;
  };
}; 