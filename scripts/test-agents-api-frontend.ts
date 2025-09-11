#!/usr/bin/env node
// Script to test the agents API endpoint that the frontend uses
import { config } from 'dotenv';

// Load environment variables from .env.local file
config({ path: '.env.local' });

async function testAgentsAPIFrontend() {
  console.log('Testing agents API endpoint for frontend...');
  
  try {
    // Mock the NextRequest object
    const mockRequest = {
      url: 'http://localhost:3000/api/agents',
    };
    
    // Import and test the API route handler
    const { GET } = await import('../app/api/agents/route');
    
    console.log('Calling API route handler...');
    const response = await GET(mockRequest as any);
    const data = await response.json();
    
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`Successfully fetched ${data.agents?.length || 0} agents`);
      if (data.agents) {
        data.agents.forEach((agent: any) => {
          console.log(`- ${agent.name} (${agent.type}) - Status: ${agent.status}`);
          console.log(`  Last run: ${agent.lastRun || 'Never'}`);
          console.log(`  Metrics:`, agent.metrics);
        });
      }
    } else {
      console.error('API returned error:', data.message);
    }
    
    console.log('\nTest completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error testing agents API route:', error);
    process.exit(1);
  }
}

testAgentsAPIFrontend();