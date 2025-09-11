#!/usr/bin/env node
// Script to initialize the agent system
import { config } from 'dotenv';
import { initializeAgentSystem } from '../lib/agent-service';

// Load environment variables from .env.local file
config({ path: '.env.local' });

async function main() {
  console.log('Initializing agent system...');
  
  try {
    await initializeAgentSystem();
    console.log('Agent system initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize agent system:', error);
    process.exit(1);
  }
}

main();