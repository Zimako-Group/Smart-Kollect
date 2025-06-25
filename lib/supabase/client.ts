// IMPORTANT: Import the singleton Supabase client to avoid multiple instances
import { supabase as supabaseInstance } from '../supabaseClient';

// Re-export the singleton client from supabaseClient.ts
export const supabase = supabaseInstance;

// WARNING: Do not create new Supabase clients in different files
// This causes authentication conflicts and the "Multiple GoTrueClient instances" warning
// Always use the singleton client from supabaseClient.ts
