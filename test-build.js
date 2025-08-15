// Test script to verify build configuration
const { exec } = require('child_process');
const path = require('path');

console.log('Testing Next.js build configuration...\n');

// Check if environment variables are set
const envVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

console.log('Environment Variables Status:');
Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}: ${value ? '✓ Set' : '✗ Not Set'}`);
});

console.log('\nAttempting build without environment variables...');
console.log('This simulates the Vercel build environment.\n');

// Run build without environment variables
const buildProcess = exec('npx next build', {
  cwd: __dirname,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
  }
}, (error, stdout, stderr) => {
  if (error) {
    console.error('Build failed with error:', error.message);
    console.error('\nError output:', stderr);
    process.exit(1);
  }
  
  console.log('Build completed successfully!');
  console.log('\nBuild output:', stdout);
});

buildProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

buildProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});
