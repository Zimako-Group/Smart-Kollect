// Simple script to test Redis connection
require('dotenv').config();
const { Redis } = require('@upstash/redis');

// Debug: Print environment variables (without sensitive values)
console.log('Environment variables:');
console.log('UPSTASH_REDIS_REST_URL exists:', !!process.env.UPSTASH_REDIS_REST_URL);
console.log('UPSTASH_REDIS_REST_TOKEN exists:', !!process.env.UPSTASH_REDIS_REST_TOKEN);

async function testRedisConnection() {
  try {
    // Initialize Redis client with environment variables
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    console.log('Connecting to Redis...');
    
    // Test setting a value
    const testKey = 'test:connection';
    const testValue = { 
      message: 'Redis connection successful!', 
      timestamp: new Date().toISOString() 
    };
    
    await redis.set(testKey, testValue, { ex: 60 }); // Expire in 60 seconds
    console.log('Successfully set test value in Redis');
    
    // Test getting the value back
    const retrievedValue = await redis.get(testKey);
    console.log('Retrieved value from Redis:', retrievedValue);
    
    // Test deleting the value
    await redis.del(testKey);
    console.log('Successfully deleted test value from Redis');
    
    // Verify it's gone
    const afterDelete = await redis.get(testKey);
    console.log('Value after deletion:', afterDelete);
    
    console.log('\nRedis connection test completed successfully!');
  } catch (error) {
    console.error('Redis connection test failed:', error);
  }
}

// Run the test
testRedisConnection();
