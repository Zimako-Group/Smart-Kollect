#!/usr/bin/env node
// Script to start the agent scheduler
import { config } from 'dotenv';
import { initializeScheduler, getSchedulerStatus } from '../lib/agent-scheduler';

// Load environment variables from .env.local file
config({ path: '.env.local' });

async function main() {
  console.log('Starting agent scheduler...');
  
  try {
    // Initialize the scheduler
    await initializeScheduler();
    
    // Get status
    const status = getSchedulerStatus();
    console.log(`Scheduler started successfully with ${status.activeJobs} active jobs`);
    console.log('Scheduled agents:', status.scheduledAgents);
    
    // Keep the process running
    console.log('Agent scheduler is running. Press Ctrl+C to stop.');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nReceived SIGINT. Shutting down gracefully...');
      const { shutdownScheduler } = require('../lib/agent-scheduler');
      shutdownScheduler();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\nReceived SIGTERM. Shutting down gracefully...');
      const { shutdownScheduler } = require('../lib/agent-scheduler');
      shutdownScheduler();
      process.exit(0);
    });
    
    // Keep the process alive
    setInterval(() => {
      // Log status every hour
      const currentStatus = getSchedulerStatus();
      console.log(`[${new Date().toISOString()}] Scheduler status: ${currentStatus.activeJobs} active jobs`);
    }, 3600000); // 1 hour
    
  } catch (error) {
    console.error('Failed to start agent scheduler:', error);
    process.exit(1);
  }
}

main();
