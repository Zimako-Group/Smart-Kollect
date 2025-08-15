// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting auth session:', error);
          setAuthState({ user: null, session: null, loading: false });
          return;
        }
        
        if (data?.session) {
          setAuthState({
            user: data.session.user,
            session: data.session,
            loading: false,
          });
        } else {
          setAuthState({ user: null, session: null, loading: false });
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
        setAuthState({ user: null, session: null, loading: false });
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log('Auth state changed:', event);
        
        if (session) {
          setAuthState({
            user: session.user,
            session: session,
            loading: false,
          });
        } else {
          setAuthState({ user: null, session: null, loading: false });
        }
      }
    );

    // Clean up subscription
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    isAuthenticated: !!authState.session,
  };
}
