// IMPORTANT: Import the singleton Supabase admin client to avoid multiple instances
import { supabaseAdmin } from '../supabaseClient';

// Re-export the admin client from supabaseClient.ts
export const createAdminClient = () => {
  // Return the singleton admin client instead of creating a new one
  return supabaseAdmin;
};
