// lib/settings-service.ts
import { supabase, supabaseAdmin } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface SystemSetting {
  id: string;
  name: string;
  description: string;
  value: any;
  type: string;
  category: string;
  options?: string[];
}

// Helper function to parse values from database
const parseSettingValue = (value: any): any => {
  if (typeof value === 'string') {
    try {
      // Try to parse as JSON if it looks like JSON
      if ((value.startsWith('{') && value.endsWith('}')) || 
          (value.startsWith('[') && value.endsWith(']'))) {
        return JSON.parse(value);
      }
    } catch (e) {
      // If parsing fails, return the original string
    }
  }
  return value;
};

// Helper function to prepare values for database
const prepareValueForStorage = (value: any): any => {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return value;
};

// Create the settings table if it doesn't exist
export const initializeSettingsTable = async () => {
  try {
    // Check if the table exists by trying to select from it
    const { error } = await supabaseAdmin.from('system_settings').select('id').limit(1);
    
    if (error && error.code === '42P01') { // Table doesn't exist
      // Create the table using SQL (requires service role)
      const { error: createError } = await supabaseAdmin.rpc('create_system_settings_table');
      
      if (createError) {
        console.error('Error creating system_settings table:', createError);
        return false;
      }
      
      // Insert default settings for all categories
      const defaultCategories = ['general', 'appearance', 'notifications', 'security', 'integrations', 'billing'];
      
      // Default settings for each category
      const defaultSettings: Record<string, Omit<SystemSetting, 'id'>[]> = {
        general: [
          {
            name: 'Company Name',
            description: 'Your company name as it appears throughout the system',
            value: 'Zimako Debt Collection',
            type: 'text',
            category: 'general'
          },
          {
            name: 'Contact Email',
            description: 'Primary contact email for your business',
            value: 'support@zimako.com',
            type: 'text',
            category: 'general'
          }
        ],
        security: [
          {
            name: 'Password Policy',
            description: 'Password requirements for users',
            value: 'Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character',
            type: 'textarea',
            category: 'security'
          }
        ]
      };
      
      // Insert default settings for each category
      for (const category of defaultCategories) {
        if (defaultSettings[category]) {
          await insertDefaultSettings(category, defaultSettings[category]);
        }
      }
      
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing settings table:', error);
    return false;
  }
};

// Get all settings
export const getAllSettings = async (): Promise<SystemSetting[]> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*');
      
    if (error) {
      console.error('Error fetching settings:', error);
      return [];
    }
    
    // Convert values to proper JavaScript types
    return data.map(item => ({
      ...item,
      value: parseSettingValue(item.value),
      options: item.options ? item.options.map(parseSettingValue) : undefined
    })) as SystemSetting[];
  } catch (error) {
    console.error('Error in getAllSettings:', error);
    return [];
  }
};

// Get settings by category
export const getSettingsByCategory = async (category: string): Promise<SystemSetting[]> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('category', category);
      
    if (error) {
      console.error(`Error fetching ${category} settings:`, error);
      return [];
    }
    
    // Convert values to proper JavaScript types
    return data.map(item => ({
      ...item,
      value: parseSettingValue(item.value),
      options: item.options ? item.options.map(parseSettingValue) : undefined
    })) as SystemSetting[];
  } catch (error) {
    console.error(`Error in getSettingsByCategory for ${category}:`, error);
    return [];
  }
};

// Update a setting
export const updateSetting = async (settingId: string, value: string | boolean | number | object): Promise<boolean> => {
  try {
    const preparedValue = prepareValueForStorage(value);
    
    const { error } = await supabaseAdmin
      .from('system_settings')
      .update({ value: preparedValue })
      .eq('id', settingId);
      
    if (error) {
      console.error('Error updating setting:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateSetting:', error);
    return false;
  }
};

// Update multiple settings at once
export const updateSettings = async (settings: { id: string; value: string | boolean | number | object }[]): Promise<boolean> => {
  try {
    // Use a transaction to update all settings
    const updates = settings.map(setting => 
      supabaseAdmin
        .from('system_settings')
        .update({ value: prepareValueForStorage(setting.value) })
        .eq('id', setting.id)
    );
    
    const results = await Promise.all(updates);
    
    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Errors updating settings:', errors);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateSettings:', error);
    return false;
  }
};

// Insert a new setting
export const insertSetting = async (setting: Omit<SystemSetting, 'id'>): Promise<string | null> => {
  try {
    const preparedSetting = {
      ...setting,
      value: prepareValueForStorage(setting.value),
      options: setting.options ? setting.options.map(prepareValueForStorage) : undefined
    };
    
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .insert([preparedSetting])
      .select('id')
      .single();
      
    if (error) {
      console.error('Error inserting setting:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error in insertSetting:', error);
    return null;
  }
};

// Insert default settings
export async function insertDefaultSettings(category: string, settings: Omit<SystemSetting, 'id'>[]): Promise<boolean> {
  try {
    // Add UUIDs to the settings
    const settingsWithIds = settings.map(setting => ({
      ...setting,
      id: uuidv4(),
      value: prepareValueForStorage(setting.value),
      options: setting.options ? setting.options.map(prepareValueForStorage) : undefined
    }));
    
    const { error } = await supabaseAdmin
      .from('system_settings')
      .insert(settingsWithIds);
    
    if (error) {
      console.error(`Error inserting default ${category} settings:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error in insertDefaultSettings for ${category}:`, error);
    return false;
  }
}

// Create system settings table and policies
export async function createSystemSettingsTable(): Promise<boolean> {
  try {
    // Check if system_settings table exists
    const { data: tableExists, error: checkError } = await supabaseAdmin
      .from('system_settings')
      .select('id')
      .limit(1);
      
    if (checkError && checkError.code !== 'PGRST116') {
      // If the error is not "relation does not exist", something else is wrong
      console.error('Error checking if system_settings table exists:', checkError);
      return false;
    }
    
    // If the table doesn't exist (we got PGRST116 error or no data), show instructions
    if (checkError || !tableExists || tableExists.length === 0) {
      console.error('System settings table does not exist. Please create it manually using the SQL in the migration file.');
      console.log('You can find the SQL in: supabase/migrations/20250324_create_system_settings.sql');
      console.log('Run this SQL in the Supabase SQL Editor to create the table and set up RLS policies.');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in createSystemSettingsTable:', error);
    return false;
  }
}
