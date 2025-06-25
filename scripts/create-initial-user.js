// scripts/create-initial-user.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUser() {
  try {
    // Create the user
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: 'tjmarvin83@gmail.com',
      password: '832287767@Tj',
      email_confirm: true, // Auto-confirm the email
    });

    if (createError) {
      throw createError;
    }

    console.log('User created successfully:', user);

    // Update the user's role to 'agent' in the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'agent' })
      .eq('id', user.user.id);

    if (updateError) {
      throw updateError;
    }

    console.log('User role set to agent successfully');
    console.log('Initial user setup complete!');
    console.log('Email: tjmarvin83@gmail.com');
    console.log('Password: 832287767@Tj');
    console.log('Role: agent');

  } catch (error) {
    console.error('Error creating user:', error);
  }
}

createUser();
