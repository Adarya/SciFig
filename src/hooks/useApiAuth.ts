import { useState, useEffect, useRef } from 'react';
import { apiClient, User, AuthResponse } from '../services/apiClient';
import { supabase } from '../utils/supabase';

export interface ApiAuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useApiAuth = () => {
  const [state, setState] = useState<ApiAuthState>({
    user: null,
    loading: true,
    error: null
  });

  // Add ref to track if session check is in progress
  const checkingSession = useRef(false);
  // Store backend token separately

  useEffect(() => {
    // Check if user is authenticated on mount
    checkSession();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      // Only check session if not already checking
      if (!checkingSession.current) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // When signed in or token refreshed, sync with backend
          checkSession();
        } else if (event === 'SIGNED_OUT') {
          // Clear user when signed out
          setState(prev => ({ ...prev, user: null, loading: false }));
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    // Prevent concurrent session checks
    if (checkingSession.current) {
      return;
    }
    
    checkingSession.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Get Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setState(prev => ({ ...prev, user: null, loading: false }));
        return;
      }

      // Verify session with backend with timeout
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Backend auth timeout')), 5000)
      );
      
      try {
        const result = await Promise.race([
          apiClient.auth.checkSession(),
          timeoutPromise
        ]) as { valid: boolean; user?: User };
        
        if (result.valid && result.user) {
          setState({ user: result.user, loading: false, error: null });
        } else {
          // Backend validation failed, but user might still be authenticated with Supabase
          // Don't block the app, just set user to null but allow continued use
          setState({ user: null, loading: false, error: null });
        }
      } catch (backendError) {
        // Backend is down or auth failed - don't block the user
        console.warn('Backend auth check failed, continuing with Supabase-only auth:', backendError);
        setState({ user: null, loading: false, error: null });
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Session verification failed' 
      }));
    } finally {
      checkingSession.current = false;
    }
  };

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // First sign in with Supabase
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (supabaseError) throw supabaseError;
      
      // Then login with backend to sync
      const response = await apiClient.auth.login({ email, password });
      setState({ user: response.user, loading: false, error: null });
      
      return response;
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
      // First sign up with Supabase
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name || '' }
        }
      });
      
      if (supabaseError) throw supabaseError;
      
      // Then register with backend
      const response = await apiClient.auth.signup({ email, password, name });
      
      setState(prev => ({ 
        ...prev, 
        loading: false 
        // Don't set user here as they might need to confirm email
      }));
      
      return response;
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
      // Use Supabase for OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
      // Backend sync will happen via onAuthStateChange when redirected back
      return data;
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
      // Logout from backend first
      await apiClient.auth.logout();
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      
      setState({ user: null, loading: false, error: null });
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
      // Use Supabase for password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
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

  const updateUser = async (updates: { name?: string }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Update user profile in backend
      const updatedUser = await apiClient.auth.me();
      setState({ user: updatedUser, loading: false, error: null });
      return updatedUser;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Profile update failed' 
      }));
      throw error;
    }
  };

  const getLimits = async () => {
    try {
      return await apiClient.auth.getLimits();
    } catch (error) {
      console.error('Failed to get usage limits:', error);
      return {
        analyses_remaining: 0,
        figures_remaining: 0,
        storage_used: 0,
        storage_limit: 0
      };
    }
  };

  return {
    ...state,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateUser,
    checkSession,
    getLimits
  };
}; 