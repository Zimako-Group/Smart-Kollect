// IMPORTANT: Import the singleton Supabase client to avoid multiple instances
import { getSupabaseClient } from '../supabaseClient';

// Re-export the singleton client function from supabaseClient.ts
export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : ({} as any);

// WARNING: Do not create new Supabase clients in different files
// This causes authentication conflicts and the "Multiple GoTrueClient instances" warning
// Always use the singleton client from supabaseClient.ts
