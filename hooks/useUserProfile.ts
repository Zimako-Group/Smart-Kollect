import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userProfileService, UserProfile, UserStats, ApiKey, Session } from '@/lib/user-profile-service';

export const useUserProfile = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all user data in parallel
      const [profileData, statsData, apiKeysData, sessionsData] = await Promise.all([
        userProfileService.getUserProfile(user.id),
        userProfileService.getUserStats(user.id),
        userProfileService.getApiKeys(user.id),
        userProfileService.getSessions(user.id)
      ]);

      setProfile(profileData);
      setStats(statsData);
      setApiKeys(apiKeysData);
      setSessions(sessionsData);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchUserData();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user?.id, authLoading]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) return { success: false, error: 'No user found' };

    const result = await userProfileService.updateUserProfile(user.id, updates);
    
    if (result.success) {
      // Refresh profile data
      const updatedProfile = await userProfileService.getUserProfile(user.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    }
    
    return result;
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    return await userProfileService.changePassword(currentPassword, newPassword);
  };

  const toggle2FA = async (enabled: boolean) => {
    if (!user?.id) return { success: false, error: 'No user found' };

    const result = await userProfileService.toggle2FA(enabled);
    
    if (result.success) {
      // Refresh profile data to update 2FA status
      const updatedProfile = await userProfileService.getUserProfile(user.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    }
    
    return result;
  };

  const verify2FA = async (factorId: string, challengeId: string, code: string) => {
    return await userProfileService.verify2FA(factorId, challengeId, code);
  };

  const createApiKey = async (name: string) => {
    if (!user?.id) return { success: false, error: 'No user found' };

    const result = await userProfileService.createApiKey(user.id, name);
    
    if (result.success) {
      // Refresh API keys
      const updatedKeys = await userProfileService.getApiKeys(user.id);
      setApiKeys(updatedKeys);
    }
    
    return result;
  };

  const revokeApiKey = async (keyId: string) => {
    const result = await userProfileService.revokeApiKey(keyId);
    
    if (result.success) {
      // Remove from local state
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
    }
    
    return result;
  };

  const endSession = async (sessionId: string) => {
    const result = await userProfileService.endSession(sessionId);
    
    if (result.success) {
      // Remove from local state
      setSessions(prev => prev.filter(session => session.id !== sessionId));
    }
    
    return result;
  };

  return {
    profile,
    stats,
    apiKeys,
    sessions,
    isLoading: isLoading || authLoading,
    error,
    updateProfile,
    changePassword,
    toggle2FA,
    verify2FA,
    createApiKey,
    revokeApiKey,
    endSession,
    refreshData: fetchUserData
  };
};
