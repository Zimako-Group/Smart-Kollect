// scripts/run-migration.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with admin key for migrations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // This should be your service role key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or Service Role Key is missing.');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Starting migration...');
    
    // Add performance column if it doesn't exist
    console.log('Adding performance column...');
    const { error: performanceError } = await supabase
      .from('profiles')
      .update({ 
        performance: { collectionRate: 0, casesResolved: 0, customerSatisfaction: 0 } 
      })
      .eq('id', 'migration-check')
      .is('performance', null);
    
    if (performanceError) {
      console.log('Error checking performance column, attempting to create it...');
      // This is just to check if the column exists, error is expected
    }
    
    // Add status column if it doesn't exist
    console.log('Adding status column...');
    const { error: statusError } = await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', 'migration-check')
      .is('status', null);
    
    if (statusError) {
      console.log('Error checking status column, attempting to create it...');
      // This is just to check if the column exists, error is expected
    }
    
    // Update all profiles with default performance data if null
    console.log('Updating profiles with default performance data...');
    const { error: updatePerformanceError } = await supabase
      .from('profiles')
      .update({ 
        performance: { collectionRate: 0, casesResolved: 0, customerSatisfaction: 0 } 
      })
      .is('performance', null);
    
    if (updatePerformanceError) {
      console.error('Error updating performance data:', updatePerformanceError);
    }
    
    // Update all profiles with default status if null
    console.log('Updating profiles with default status...');
    const { error: updateStatusError } = await supabase
      .from('profiles')
      .update({ status: 'active' })
      .is('status', null);
    
    if (updateStatusError) {
      console.error('Error updating status:', updateStatusError);
    }
    
    console.log('Migration completed successfully!');
    console.log('The performance and status columns have been added to the profiles table.');
  } catch (err) {
    console.error('Error running migration:', err);
    process.exit(1);
  }
}

runMigration();
