// lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, UserRole } from '@/contexts/AuthContext';

// Database types
export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  status?: 'active' | 'inactive' | 'on leave';
  performance?: {
    collectionRate?: number;
    casesResolved?: number;
    customerSatisfaction?: number;
  };
  // Removed deleted_at field since it doesn't exist in the database
};

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}

// Create a single supabase client for interacting with your database
// Use a singleton pattern to ensure we only create one instance
let _supabaseInstance: SupabaseClient | null = null;
let _supabaseAdminInstance: SupabaseClient | null = null;

// Add a simple request throttling mechanism
const throttleMap = new Map<string, number>();
const THROTTLE_WINDOW_MS = 2000; // 2 seconds

const isThrottled = (key: string): boolean => {
  const now = Date.now();
  const lastRequestTime = throttleMap.get(key);
  
  if (lastRequestTime && now - lastRequestTime < THROTTLE_WINDOW_MS) {
    return true;
  }
  
  throttleMap.set(key, now);
  return false;
};

// Custom storage implementation to handle errors
const customStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  }
};

export const getSupabaseClient = (): SupabaseClient => {
  if (!_supabaseInstance) {
    console.log('Initializing Supabase client with URL:', supabaseUrl);
    _supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'zimako-supabase-auth',
        storage: customStorage
      }
    });
    
    // Set up auth state change listener
    if (typeof window !== 'undefined') {
      _supabaseInstance.auth.onAuthStateChange((event, session) => {
        console.log(`[SUPABASE] Auth state change: ${event}`);
        
        if (event === 'SIGNED_OUT') {
          // Clear all auth-related data from localStorage
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('supabase') || key.includes('zimako') || key.startsWith('profile_'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[SUPABASE] Token refreshed successfully');
        } else if (event === 'USER_UPDATED') {
          console.log('[SUPABASE] User data updated');
        }
      });
    }
  }
  return _supabaseInstance;
};

export const getSupabaseAdminClient = (): SupabaseClient => {
  if (!_supabaseAdminInstance && supabaseServiceKey) {
    _supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });
  }
  return _supabaseAdminInstance || getSupabaseClient();
};

// Export the singleton instances
export const supabase = getSupabaseClient();
export const supabaseAdmin = getSupabaseAdminClient();

// Auth functions
export const supabaseAuth = {
  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    // Prevent multiple rapid sign-in attempts
    if (isThrottled(`signIn-${email}`)) {
      console.log('Sign-in request throttled to prevent rate limiting');
      return { data: null, error: { message: 'Too many requests, please try again in a moment', status: 429 } };
    }
    
    return supabase.auth.signInWithPassword({ email, password });
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    if (isThrottled('signOut')) {
      console.log('Sign-out request throttled');
      return { error: null };
    }
    return supabase.auth.signOut();
  },

  /**
   * Get the current session
   */
  getSession: async () => {
    if (isThrottled('getSession')) {
      console.log('getSession request throttled');
      // Return cached session if available
      const cachedSession = typeof localStorage !== 'undefined' ? 
        JSON.parse(localStorage.getItem('supabase_session') || 'null') : null;
      
      if (cachedSession) {
        return { data: { session: cachedSession }, error: null };
      }
    }
    
    const result = await supabase.auth.getSession();
    
    // Cache the session
    if (result.data.session && typeof localStorage !== 'undefined') {
      localStorage.setItem('supabase_session', JSON.stringify(result.data.session));
    }
    
    return result;
  },

  /**
   * Get the current user
   */
  getUser: async () => {
    if (isThrottled('getUser')) {
      console.log('getUser request throttled');
      // Return cached user if available
      const cachedUser = typeof localStorage !== 'undefined' ? 
        JSON.parse(localStorage.getItem('supabase_user') || 'null') : null;
      
      if (cachedUser) {
        return cachedUser;
      }
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Cache the user
    if (user && typeof localStorage !== 'undefined') {
      localStorage.setItem('supabase_user', JSON.stringify(user));
    }
    
    return user;
  },

  /**
   * Get user profile with role information
   */
  getUserProfile: async (userId: string): Promise<Profile | null> => {
    // Use cache for repeated profile requests
    const cacheKey = `getUserProfile-${userId}`;
    if (isThrottled(cacheKey)) {
      console.log('getUserProfile request throttled');
      // Return cached profile if available
      const cachedProfile = typeof localStorage !== 'undefined' ? 
        JSON.parse(localStorage.getItem(`profile_${userId}`) || 'null') : null;
      
      if (cachedProfile) {
        return cachedProfile;
      }
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If profile doesn't exist, create it with default values
        if (error.code === 'PGRST116') {
          const authUser = await supabaseAuth.getUser();
          if (authUser) {
            const newProfile: Profile = {
              id: userId,
              full_name: authUser.email?.split('@')[0] || 'User',
              email: authUser.email || '',
              role: 'agent' as UserRole,
              status: 'active' as const,
              avatar_url: undefined,
              performance: {
                collectionRate: 0,
                casesResolved: 0,
                customerSatisfaction: 0
              }
            };
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([newProfile]);
              
            if (insertError) {
              console.error('Error creating profile:', insertError);
              return null;
            }
            
            // Cache the new profile
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(`profile_${userId}`, JSON.stringify(newProfile));
            }
            
            return newProfile;
          }
        }
        return null;
      }
      
      // Cache the profile
      if (data && typeof localStorage !== 'undefined') {
        localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
      }
      
      return data as Profile;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (userId: string, updates: Partial<Profile>) => {
    // Clear the profile cache when updating
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`profile_${userId}`);
    }
    
    return supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
  },

  /**
   * Create a new user 
   */
  createUser: async (email: string, password: string, userData: Partial<Profile>) => {
    try {
      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role || 'agent',
            status: userData.status || 'active'
          }
        }
      });

      if (authError) {
        console.error('Error creating user:', authError);
        return { success: false, error: authError.message };
      }

      if (authData.user) {
        // Create the profile
        const profile: Profile = {
          id: authData.user.id,
          full_name: userData.full_name || email.split('@')[0],
          email: email,
          role: userData.role || 'agent',
          status: userData.status as 'active' | 'inactive' | 'on leave' || 'active',
          avatar_url: userData.avatar_url,
          performance: {
            collectionRate: 0,
            casesResolved: 0,
            customerSatisfaction: 0
          }
        };

        // Use RPC to bypass RLS policies
        const { error: profileError } = await supabase
          .rpc('create_profile', { 
            profile_id: profile.id,
            profile_email: profile.email,
            profile_full_name: profile.full_name,
            profile_role: profile.role,
            profile_status: profile.status,
            profile_avatar_url: profile.avatar_url,
            profile_performance: profile.performance
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          
          // Fallback to direct insert if RPC fails
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([profile])
            .select();

          if (insertError) {
            console.error('Error inserting profile:', insertError);
            return { success: false, error: 'Failed to create user profile' };
          }
        }

        return { success: true, user: authData.user };
      } else {
        return { success: false, error: 'No user returned from auth signup' };
      }
    } catch (error: any) {
      console.error('Error in createUser:', error);
      return { success: false, error: error.message || 'Unknown error creating user' };
    }
  },

  /**
   * Get all users (admin only)
   */
  getAllUsers: async (): Promise<Profile[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        // Removed the filter for deleted_at since the column doesn't exist
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return data as Profile[];
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  },

  /**
   * Update user status (admin only)
   */
  updateUserStatus: async (userId: string, status: 'active' | 'inactive' | 'on leave') => {
    try {
      // Clear the profile cache when updating
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`profile_${userId}`);
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in updateUserStatus:', error);
      return { success: false, error: error.message || 'Unknown error updating user status' };
    }
  },

  /**
   * Update user role (admin only)
   */
  updateUserRole: async (userId: string, role: UserRole) => {
    try {
      // Clear the profile cache when updating
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`profile_${userId}`);
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in updateUserRole:', error);
      return { success: false, error: error.message || 'Unknown error updating user role' };
    }
  },

  /**
   * Delete a user (admin only)
   */
  deleteUser: async (userId: string) => {
    try {
      // First, soft delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          deleted_at: new Date().toISOString(),
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Error soft deleting profile:', profileError);
        return { success: false, error: profileError.message };
      }

      // Clear the profile cache
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`profile_${userId}`);
      }

      // For a complete deletion, we would also delete the auth user
      // This requires admin privileges and should be done with caution
      // We're using the service role client for this
      if (supabaseServiceKey) {
        const adminClient = getSupabaseAdminClient();
        const { error: authError } = await adminClient.auth.admin.deleteUser(userId);

        if (authError) {
          console.error('Error deleting auth user:', authError);
          // We still return success since the profile was soft deleted
          return { 
            success: true, 
            warning: `User profile was soft deleted, but auth user deletion failed: ${authError.message}`
          };
        }
      } else {
        // If no service role key, just return with a warning
        return { 
          success: true, 
          warning: 'User profile was soft deleted, but auth user was not deleted due to missing service role key'
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in deleteUser:', error);
      return { success: false, error: error.message || 'Unknown error deleting user' };
    }
  }
};

// Create a hook to subscribe to auth changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  // We'll use a debounce mechanism to prevent multiple rapid callbacks
  let timeoutId: NodeJS.Timeout | null = null;
  let lastUser: User | null = null;
  
  const handleAuthChange = async (event: string, session: any) => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Set a new timeout to debounce the callback
    timeoutId = setTimeout(async () => {
      try {
        if (event === 'SIGNED_IN' && session) {
          const profile = await supabaseAuth.getUserProfile(session.user.id);
          if (profile) {
            const user: User = {
              id: profile.id,
              name: profile.full_name,
              email: profile.email,
              role: profile.role,
              avatar: profile.avatar_url
            };
            
            // Only call callback if user has changed
            if (!lastUser || lastUser.id !== user.id) {
              lastUser = user;
              callback(user);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          lastUser = null;
          callback(null);
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
      }
    }, 100); // 100ms debounce
  };
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
  
  return subscription;
};
