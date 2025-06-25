// lib/security-utils.ts
import { supabase } from './supabaseClient';

/**
 * Fetches security settings from the database
 * @returns Object containing security settings
 */
export const getSecuritySettings = async () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return {
        passwordPolicy: 'Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character',
        require2FA: false
      };
    }

    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('category', 'security');
    
    if (error) {
      console.error('Error fetching security settings:', error);
      return {
        passwordPolicy: 'Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character',
        require2FA: false
      };
    }
    
    // Extract settings from the data
    const settings = {
      passwordPolicy: 'Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character',
      require2FA: false
    };
    
    // Update settings with values from database
    if (data && data.length > 0) {
      data.forEach(setting => {
        if (setting.name === 'Password Policy') {
          settings.passwordPolicy = setting.value || settings.passwordPolicy;
        } else if (setting.name === 'Two-Factor Authentication') {
          settings.require2FA = setting.value === 'true' || setting.value === true;
        }
      });
    }
    
    return settings;
  } catch (error) {
    console.error('Error in getSecuritySettings:', error);
    return {
      passwordPolicy: 'Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character',
      require2FA: false
    };
  }
};

// Disabled session timeout functions
export const applySessionTimeout = (timeoutMinutes: number = 30) => {
  console.log("[SECURITY] Session timeout functionality has been disabled");
  // Function intentionally left empty to disable session timeout
};

export const clearSessionTimeout = () => {
  console.log("[SECURITY] Session timeout cleanup has been disabled");
  // Function intentionally left empty to disable session timeout cleanup
};

// Add TypeScript declarations
declare global {
  interface Window {
    __sessionTimeoutId?: any;
    __sessionTimeoutCleanup?: () => void;
  }
}
