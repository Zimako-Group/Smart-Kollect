// Script to apply the reports table migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function applyMigration() {
  try {
    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('Reading migration file...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'reports-table-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying migration...');
    
    // Execute the migration SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });
    
    if (error) {
      throw new Error(`Migration failed: ${error.message}`);
    }
    
    console.log('Migration applied successfully!');
    
    // Verify the reports table exists by trying to select from it
    const { data, error: checkError } = await supabase
      .from('reports')
      .select('count', { count: 'exact', head: true });
    
    if (checkError && !checkError.message.includes('does not exist')) {
      console.warn(`Warning when checking reports table: ${checkError.message}`);
    } else if (checkError && checkError.message.includes('does not exist')) {
      console.warn('Reports table does not exist yet. This might be expected if this is the first run.');
    } else {
      console.log('Verified reports table exists');
    }
    
  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

// Run the migration
applyMigration();
