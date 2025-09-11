#!/usr/bin/env node
// Script to test agent execution and check if lastRun is updated
import { config } from 'dotenv';
import { getAllAgents, executeAgent } from '@/lib/agent-service';

// Load environment variables from .env.local file
config({ path: '.env.local' });

async function testAgentExecution() {
  console.log('Testing agent execution...');
  
  try {
    // Get all agents
    console.log('Fetching agents...');
    const agents = await getAllAgents();
    
    if (agents.length === 0) {
      console.log('No agents found');
      process.exit(1);
    }
    
    console.log(`Found ${agents.length} agents:`);
    agents.forEach(agent => {
      console.log(`- ${agent.name} (${agent.id}) - Last run: ${agent.lastRun || 'Never'}`);
    });
    
    // Execute the first agent
    const agentToExecute = agents[0];
    console.log(`\nExecuting agent: ${agentToExecute.name} (${agentToExecute.id})`);
    
    const result = await executeAgent(agentToExecute.id);
    console.log('Execution result:', result);
    
    // Check if lastRun was updated
    console.log('\nFetching updated agent info...');
    const updatedAgents = await getAllAgents();
    const updatedAgent = updatedAgents.find(a => a.id === agentToExecute.id);
    
    if (updatedAgent) {
      console.log(`Updated agent: ${updatedAgent.name}`);
      console.log(`Last run: ${updatedAgent.lastRun || 'Still Never'}`);
      console.log(`Metrics:`, updatedAgent.metrics);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing agent execution:', error);
    process.exit(1);
  }
}

testAgentExecution();