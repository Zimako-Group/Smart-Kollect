import { supabase } from './supabase';
import { createClient } from '@vercel/kv';

// Initialize KV storage for caching
const kv = createClient({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

// Helper function to create the reports table if it doesn't exist
export async function ensureReportsTableExists() {
  try {
    // Check if the reports table exists
    const { data: tableExists, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'reports')
      .eq('table_schema', 'public')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // Not found is ok
      throw new Error(`Error checking if reports table exists: ${checkError.message}`);
    }
    
    // If the table doesn't exist, create it
    if (!tableExists) {
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE TABLE public.reports (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            parameters JSONB,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_generated TIMESTAMP WITH TIME ZONE,
            format TEXT NOT NULL,
            frequency TEXT
          );
        `
      });
      
      if (createError) {
        throw new Error(`Error creating reports table: ${createError.message}`);
      }
      
      console.log('Created reports table');
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring reports table exists:', error);
    return false;
  }
}

// Function to invalidate cache for a specific key
export async function invalidateCache(key: string) {
  try {
    await kv.del(key);
    console.log(`[CACHE INVALIDATED] Cleared cache for key ${key}`);
    return true;
  } catch (error) {
    console.warn(`Failed to invalidate cache for key ${key}:`, error);
    return false;
  }
}

// Function to get cached data or fetch fresh data
export async function getCachedOrFresh<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300 // Default 5 minutes
): Promise<T> {
  try {
    // Try to get data from cache first
    const cachedData = await kv.get(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] Using cached data for ${cacheKey}`);
      return cachedData as T;
    }
  } catch (cacheError) {
    // If there's an error with the cache, log it but continue to fetch fresh data
    console.warn(`Cache error for ${cacheKey}: ${cacheError}. Proceeding with fresh data fetch.`);
  }
  
  console.log(`[CACHE MISS] Fetching fresh data for ${cacheKey}`);
  
  // Fetch fresh data
  const freshData = await fetchFn();
  
  // Cache the results
  try {
    await kv.set(cacheKey, freshData, { ex: ttl });
    console.log(`[CACHE SET] Cached data for ${cacheKey} for ${ttl} seconds`);
  } catch (cacheError) {
    console.warn(`Failed to cache data for ${cacheKey}: ${cacheError}`);
  }
  
  return freshData;
}

// Function to create a migration for the reports table
export async function createReportsTableMigration() {
  const migrationSQL = `
-- Create extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  parameters JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_generated TIMESTAMP WITH TIME ZONE,
  format TEXT NOT NULL,
  frequency TEXT
);

-- Create index on created_by for faster lookups
CREATE INDEX IF NOT EXISTS reports_created_by_idx ON public.reports(created_by);

-- Create function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = $1
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$ LANGUAGE plpgsql;

-- Create function to create the reports table
CREATE OR REPLACE FUNCTION create_reports_table()
RETURNS VOID AS $$
BEGIN
  IF NOT check_table_exists('reports') THEN
    CREATE TABLE public.reports (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      parameters JSONB,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_generated TIMESTAMP WITH TIME ZONE,
      format TEXT NOT NULL,
      frequency TEXT
    );
    
    CREATE INDEX reports_created_by_idx ON public.reports(created_by);
  END IF;
END;
$$ LANGUAGE plpgsql;
  `;
  
  return migrationSQL;
}

// Function to generate a SQL migration file
export async function generateMigrationFile() {
  const migrationSQL = await createReportsTableMigration();
  return migrationSQL;
}
