"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';

// Define user roles
export type UserRole = 'admin' | 'agent' | 'manager' | 'supervisor' | 'indigent clerk' | 'system';

// Define user type
export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    [key: string]: any;
  };
};

// Define auth context type
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkPermission: (permission: string) => boolean;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Track auth requests to prevent duplicates
  const pendingAuthRequest = useRef<Promise<any> | null>(null);

  // Check if user has permission
  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Role-based permissions
    switch (permission) {
      case 'view_dashboard':
        return ['admin', 'agent', 'manager', 'supervisor', 'system'].includes(user.role);
      case 'manage_debtors':
        return ['admin', 'agent', 'manager', 'supervisor'].includes(user.role);
      case 'make_calls':
        return ['admin', 'agent', 'manager', 'supervisor'].includes(user.role);
      case 'view_reports':
        return ['admin', 'manager', 'supervisor'].includes(user.role);
      case 'manage_users':
        return ['admin', 'supervisor'].includes(user.role);
      case 'manage_settings':
        return ['admin'].includes(user.role);
      default:
        return false;
    }
  };

  // Redirect based on user role - wrapped in useCallback to prevent recreation on each render
  const redirectBasedOnRole = useCallback((role: UserRole) => {
    console.log("[AUTH] Redirecting based on role:", role);
    
    switch (role) {
      case 'admin':
        console.log("[AUTH] Redirecting admin to /admin/dashboard");
        router.push('/admin/dashboard');
        break;
      case 'system':
        console.log("[AUTH] Redirecting system user to /metrics-dashboard");
        router.push('/metrics-dashboard');
        break;
      case 'agent':
        console.log("[AUTH] Redirecting agent to /user/dashboard");
        router.push('/user/dashboard');
        break;
      case 'manager':
        console.log("[AUTH] Redirecting manager to /manager/dashboard");
        router.push('/manager/dashboard');
        break;
      case 'supervisor':
        console.log("[AUTH] Redirecting supervisor to /supervisor/dashboard");
        router.push('/supervisor/dashboard');
        break;
      case 'indigent clerk':
        console.log("[AUTH] Redirecting indigent clerk to /indigent-clerk/dashboard");
        router.push('/indigent-clerk/dashboard');
        break;
      default:
        console.log("[AUTH] Unknown role, redirecting to default /user/dashboard");
        router.push('/user/dashboard');
    }
  }, [router]);

  // Fetch user profile from database without caching
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {      
      console.log('[AUTH] Fetching user profile from database');
      const supabase = getSupabaseClient();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, avatar_url')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[AUTH] Error fetching profile:', error);
        return null;
      }
      
      if (!profile) {
        console.log('[AUTH] No profile found for user:', userId);
        return null;
      }
      
      // Map database profile to User type
      const userProfile: User = {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role as UserRole,
        avatar: profile.avatar_url
      };
      
      return userProfile;
    } catch (error) {
      console.error('[AUTH] Unexpected error fetching profile:', error);
      return null;
    }
  }, []);

  // Login function with rate limiting protection
  const login = async (email: string, password: string) => {
    // If there's already a pending auth request, return it
    if (pendingAuthRequest.current) {
      console.log('[AUTH] Using existing pending auth request');
      return pendingAuthRequest.current;
    }

    console.log('[AUTH] Starting new login request');
    setIsLoading(true);
    
    try {
      // Rate limiting check
      const loginKey = `login_attempt_${email}`;
      const lastAttempt = localStorage.getItem(loginKey);
      const now = Date.now();
      
      if (lastAttempt) {
        const timeSinceLastAttempt = now - parseInt(lastAttempt, 10);
        const minWaitTime = 1000; // 1 second between attempts
        
        if (timeSinceLastAttempt < minWaitTime) {
          console.log('[AUTH] Rate limiting login attempts');
          return { 
            success: false, 
            error: 'Please wait a moment before trying again.' 
          };
        }
      }
      
      // Record this attempt
      localStorage.setItem(loginKey, now.toString());
      
      // Clear any existing auth state first to prevent conflicts
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      
      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('[AUTH] Login error:', error.message);
        return { success: false, error: error.message };
      }
      
      if (!data || !data.user) {
        console.error('[AUTH] No user returned from login');
        return { success: false, error: 'Invalid login credentials' };
      }
      
      console.log('[AUTH] Login successful, fetching user profile');
      const userProfile = await fetchUserProfile(data.user.id);
      
      if (!userProfile) {
        console.error('[AUTH] No user profile found after login');
        await supabase.auth.signOut();
        return { success: false, error: 'User profile not found' };
      }
      
      console.log('[AUTH] Setting user state with profile');
      setUser(userProfile);
      
      // Redirect based on role
      redirectBasedOnRole(userProfile.role);
      
      return { success: true };
    } catch (err: any) {
      console.error('[AUTH] Unexpected login error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
      pendingAuthRequest.current = null;
    }
    
    // No need to return authPromise as we're handling the login directly
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('[AUTH] Logging out user');
      setIsLoading(true);
      
      // Sign out from Supabase
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      
      // Clear user from state
      setUser(null);
      
      // Redirect to main landing page using hard redirect
      window.location.href = '/';
      
      console.log('[AUTH] Logout successful');
    } catch (error) {
      console.error('[AUTH] Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize auth state - wrapped in useEffect to prevent SSR issues
  useEffect(() => {
    let mounted = true;
    console.log("[AUTH] Auth effect mounted");
    
    const initializeAuth = async () => {
      try {
        console.log("[AUTH] Starting authentication initialization");
        setIsLoading(true);

        // Check for active session directly from Supabase
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('[AUTH] Session error:', error.message);
          setUser(null);
          return;
        }
        
        if (data.user) {
          console.log('[AUTH] Active session found, fetching user profile');
          const userProfile = await fetchUserProfile(data.user.id);
          
          if (mounted && userProfile) {
            console.log('[AUTH] Setting user from profile');
            setUser(userProfile);
          } else {
            console.log('[AUTH] No user profile found for session');
            setUser(null);
          }
        } else {
          console.log('[AUTH] No active session found');
          setUser(null);
        }
      } catch (error) {
        console.error('[AUTH] Error initializing auth:', error);
        setUser(null);
      } finally {
        // Only update loading state if component is still mounted
        if (mounted) {
          console.log("[AUTH] Authentication initialization completed");
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener - use a debounced version
    let authChangeTimeoutId: NodeJS.Timeout | null = null;
    
    const handleAuthChange = (event: string, session: any) => {
      console.log("[AUTH] Auth state change event:", event);
      
      // Clear any existing timeout to debounce rapid auth changes
      if (authChangeTimeoutId) {
        clearTimeout(authChangeTimeoutId);
      }
      
      // Set a new timeout to debounce the auth change handling
      authChangeTimeoutId = setTimeout(async () => {
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' && session) {
          console.log("[AUTH] User signed in, ID:", session.user.id);
          const userProfile = await fetchUserProfile(session.user.id);
          console.log("[AUTH] User profile after sign-in:", userProfile ? "Profile found" : "No profile found");
          
          if (userProfile && mounted) {
            console.log("[AUTH] Setting user state with role:", userProfile.role);
            setUser(userProfile);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("[AUTH] User signed out");
          if (mounted) {
            setUser(null);
          }
        }
      }, 100); // 100ms debounce
    };
    
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Cleanup subscription and prevent state updates after unmount
    return () => {
      console.log('[AUTH] Cleaning up auth subscription');
      mounted = false;
      if (authChangeTimeoutId) {
        clearTimeout(authChangeTimeoutId);
      }
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, redirectBasedOnRole, router]);

  // Context value
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};