#!/usr/bin/env node
// Script to test the agents API endpoint
import { config } from 'dotenv';

// Load environment variables from .env.local file
config({ path: '.env.local' });

async function testAgentsAPI() {
  console.log('Testing agents API endpoint...');
  
  try {
    // Since we're testing from the server side, we'll directly call the agent service
    const { getAllAgents } = await import('../lib/agent-service');
    
    console.log('Fetching agents from service...');
    const agents = await getAllAgents();
    
    console.log(`Found ${agents.length} agents:`);
    agents.forEach(agent => {
      console.log(`- ${agent.name} (${agent.type}) - Status: ${agent.status}`);
    });
    
    console.log('\nTest completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error testing agents API:', error);
    process.exit(1);
  }
}

testAgentsAPI();