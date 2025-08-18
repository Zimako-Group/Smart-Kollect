import { getSupabaseClient } from './supabaseClient';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  phone?: string;
  job_title?: string;
  bio?: string;
  language?: string;
  timezone?: string;
  status: string;
  performance?: {
    collectionRate: number;
    casesResolved: number;
    customerSatisfaction: number;
  };
  created_at: string;
  updated_at: string;
  tenant_id?: string;
  // Settings
  notification_preferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    paymentReminders: boolean;
    newDebtorAssignments: boolean;
    campaignUpdates: boolean;
    systemAnnouncements: boolean;
    teamMessages: boolean;
  };
  appearance_preferences?: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    colorScheme: 'default' | 'blue' | 'green' | 'purple' | 'orange';
    reducedMotion: boolean;
    compactMode: boolean;
  };
  two_factor_enabled?: boolean;
}

export interface UserStats {
  assignedDebtors: number;
  activeCampaigns: number;
  collectionRate: number;
  totalCollected: number;
  callsMade: number;
  successfulCalls: number;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
}

export interface Session {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
}

class UserProfileService {
  private supabase = getSupabaseClient();

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          avatar_url,
          phone,
          job_title,
          bio,
          language,
          timezone,
          status,
          performance,
          created_at,
          updated_at,
          tenant_id,
          notification_preferences,
          appearance_preferences,
          two_factor_enabled
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
      return null;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user profile:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error updating user profile:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First verify current password by attempting to sign in
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user?.email) {
        return { success: false, error: 'No authenticated user found' };
      }

      // Verify current password
      const { error: signInError } = await this.supabase.auth.signInWithPassword({
        email: user.user.email,
        password: currentPassword
      });

      if (signInError) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Update to new password
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error changing password:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error changing password:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async toggle2FA(enabled: boolean): Promise<{ success: boolean; error?: string; qrCode?: string; factorId?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user?.id) {
        return { success: false, error: 'No authenticated user found' };
      }

      if (enabled) {
        // Get current hostname to determine service name
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'smartkollect.co.za';
        let serviceName = 'SmartKollect';
        
        // Customize service name based on subdomain
        if (hostname.includes('mahikeng')) {
          serviceName = 'SmartKollect Mahikeng';
        } else if (hostname.includes('triplem')) {
          serviceName = 'SmartKollect Triple M';
        } else if (hostname.includes('smartkollect')) {
          serviceName = 'SmartKollect';
        }
        
        // Enable 2FA - generate QR code with custom service name
        const { data, error } = await this.supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: serviceName
        });

        if (error) {
          console.error('Error enabling 2FA:', error);
          return { success: false, error: error.message };
        }

        return { 
          success: true, 
          qrCode: data.totp?.qr_code,
          factorId: data.id
        };
      } else {
        // Disable 2FA - unenroll all factors
        const { data: factors } = await this.supabase.auth.mfa.listFactors();
        
        if (factors?.totp && factors.totp.length > 0) {
          for (const factor of factors.totp) {
            await this.supabase.auth.mfa.unenroll({ factorId: factor.id });
          }
        }

        // Update profile to reflect 2FA status
        await this.updateUserProfile(user.user.id, { two_factor_enabled: false });

        return { success: true };
      }
    } catch (error) {
      console.error('Unexpected error toggling 2FA:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async verify2FA(factorId: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user?.id) {
        return { success: false, error: 'No authenticated user found' };
      }

      // Create a challenge first
      const { data: challenge, error: challengeError } = await this.supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) {
        console.error('Error creating 2FA challenge:', challengeError);
        return { success: false, error: challengeError.message };
      }

      // Verify the code with the challenge
      const { data, error } = await this.supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code
      });

      if (error) {
        console.error('Error verifying 2FA:', error);
        return { success: false, error: error.message };
      }

      // Update profile to reflect 2FA status
      await this.updateUserProfile(user.user.id, { two_factor_enabled: true });

      return { success: true };
    } catch (error) {
      console.error('Unexpected error verifying 2FA:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Get assigned debtors count
      const { count: assignedDebtors } = await this.supabase
        .from('Debtors')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_agent', userId);

      // Get active campaigns count (placeholder - adjust based on your campaigns table)
      const activeCampaigns = 3; // Default value

      // Get performance data from profile
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('performance')
        .eq('id', userId)
        .single();

      const performance = profile?.performance || {
        collectionRate: 0,
        casesResolved: 0,
        customerSatisfaction: 0
      };

      // Get total collected amount (placeholder - adjust based on your collections table)
      const totalCollected = 0; // Default value

      // Get calls data (placeholder - adjust based on your calls table)
      const callsMade = 0; // Default value
      const successfulCalls = 0; // Default value

      return {
        assignedDebtors: assignedDebtors || 0,
        activeCampaigns,
        collectionRate: performance.collectionRate || 0,
        totalCollected,
        callsMade,
        successfulCalls
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        assignedDebtors: 0,
        activeCampaigns: 0,
        collectionRate: 0,
        totalCollected: 0,
        callsMade: 0,
        successfulCalls: 0
      };
    }
  }

  async getApiKeys(userId: string): Promise<ApiKey[]> {
    // Placeholder implementation - adjust based on your API keys table structure
    return [];
  }

  async createApiKey(userId: string, name: string): Promise<{ success: boolean; key?: string; error?: string }> {
    // Placeholder implementation - adjust based on your API keys table structure
    const key = this.generateApiKey();
    return { success: true, key };
  }

  async revokeApiKey(keyId: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder implementation
    return { success: true };
  }

  async getSessions(userId: string): Promise<Session[]> {
    // Placeholder implementation - adjust based on your sessions tracking
    return [
      {
        id: "session-001",
        device: "Windows PC - Chrome",
        ip: "196.25.XX.XX",
        location: "Johannesburg, South Africa",
        lastActive: new Date().toISOString(),
        current: true,
      }
    ];
  }

  async endSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder implementation
    return { success: true };
  }

  private generateApiKey(): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
}

export const userProfileService = new UserProfileService();
