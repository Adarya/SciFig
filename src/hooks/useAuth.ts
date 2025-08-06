import { useState, useEffect } from 'react';
import { authService, User, AuthState } from '../utils/supabase';
import { logger } from '../utils/logger';

export const useAuth = (): AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
} => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    logger.debug('useAuth initializing', undefined, 'useAuth');
    
    let isMounted = true;
    
    // Get initial user
    authService.getCurrentUser()
      .then(user => {
        if (isMounted) {
          logger.info('Initial user check complete', { hasUser: !!user, email: user?.email }, 'useAuth');
          setState(prev => ({ ...prev, user, loading: false }));
        }
      })
      .catch(error => {
        if (isMounted) {
          logger.error('Failed to get initial user', error, 'useAuth');
          setState(prev => ({ ...prev, user: null, loading: false, error: error.message }));
        }
      });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      if (isMounted) {
        logger.info('Auth state changed', { hasUser: !!user, email: user?.email }, 'useAuth');
        setState(prev => ({ ...prev, user, loading: false }));
      }
    });

    return () => {
      logger.debug('useAuth cleanup', undefined, 'useAuth');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await authService.signIn(email, password);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Sign in failed' 
      }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await authService.signUp(email, password, name);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Sign up failed' 
      }));
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Google sign in failed' 
      }));
      throw error;
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await authService.signOut();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Sign out failed' 
      }));
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await authService.resetPassword(email);
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Password reset failed' 
      }));
      throw error;
    }
  };

  return {
    ...state,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword
  };
};