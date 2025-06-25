// IMPORTANT: Import the singleton Supabase client to avoid multiple instances
import { supabase, supabaseAdmin as originalAdmin } from './supabaseClient';

// This file now uses the singleton client from supabaseClient.ts
// instead of creating a new client, which was causing authentication issues

// Re-export the admin client from supabaseClient.ts
export const supabaseAdmin = originalAdmin;

// Note: We can't directly modify headers after client creation
// The headers are already set in the supabaseClient.ts file
// This is just a re-export of that client

// Fallback system user ID for operations that require a user ID but might not have one
export const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
