-- Migration for reports functionality
-- Creates the reports table and related functions

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

-- Create function to execute SQL dynamically (for admin use only)
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
