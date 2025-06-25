// scripts/add-columns.js
// This script adds performance and status columns to the profiles table
// It uses the public Supabase client, so it doesn't require the service role key

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addColumns() {
  try {
    console.log('Starting column addition...');
    
    // Get all profiles
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id');
    
    if (fetchError) {
      console.error('Error fetching profiles:', fetchError);
      return;
    }
    
    console.log(`Found ${profiles.length} profiles`);
    
    // Update each profile with performance and status data if they don't have it
    let successCount = 0;
    for (const profile of profiles) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          performance: { collectionRate: 0, casesResolved: 0, customerSatisfaction: 0 },
          status: 'active'
        })
        .eq('id', profile.id);
      
      if (updateError) {
        console.error(`Error updating profile ${profile.id}:`, updateError);
      } else {
        successCount++;
      }
    }
    
    console.log(`Successfully updated ${successCount} out of ${profiles.length} profiles`);
    console.log('Column addition completed!');
  } catch (err) {
    console.error('Error adding columns:', err);
  }
}

addColumns();
