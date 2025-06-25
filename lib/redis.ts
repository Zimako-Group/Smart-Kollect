import { Redis } from '@upstash/redis';

// Initialize Redis client with environment variables
// You'll need to create an Upstash Redis database and add the credentials to your .env file
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Cache TTL in seconds
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  VERY_LONG: 3600, // 1 hour
};

// Helper function to get cached data or fetch fresh data
export async function getCachedOrFresh<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  try {
    // Try to get data from cache first
    const cachedData = await redis.get<T>(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] Using cached data for ${cacheKey}`);
      return cachedData;
    }
  } catch (cacheError) {
    // If there's an error with the cache, log it but continue to fetch fresh data
    console.warn(`Cache error for ${cacheKey}: ${cacheError}. Proceeding with fresh data fetch.`);
  }
  
  console.log(`[CACHE MISS] Fetching fresh data for ${cacheKey}`);
  
  // Fetch fresh data
  const freshData = await fetchFn();
  
  // Cache the results
  try {
    await redis.set(cacheKey, freshData, { ex: ttl });
    console.log(`[CACHE SET] Cached data for ${cacheKey} for ${ttl} seconds`);
  } catch (cacheError) {
    console.warn(`Failed to cache data for ${cacheKey}: ${cacheError}`);
  }
  
  return freshData;
}

// Function to invalidate cache for a specific key
export async function invalidateCache(key: string): Promise<boolean> {
  try {
    await redis.del(key);
    console.log(`[CACHE INVALIDATED] Cleared cache for key ${key}`);
    return true;
  } catch (error) {
    console.warn(`Failed to invalidate cache for key ${key}:`, error);
    return false;
  }
}

// Function to invalidate cache keys by pattern (using scan + del)
export async function invalidateCacheByPattern(pattern: string): Promise<boolean> {
  try {
    let cursor = 0;
    let keys: string[] = [];
    
    // Scan for keys matching the pattern
    do {
      // The Upstash Redis client returns [string, string[]] for scan
      // First element is the cursor, second is the array of keys
      const result = await redis.scan(cursor, { match: pattern, count: 100 });
      
      // Handle the result based on its actual structure
      if (Array.isArray(result)) {
        // Handle the array format [cursor, keys]
        cursor = parseInt(result[0]);
        keys = keys.concat(result[1]);
      } else if (typeof result === 'object' && result !== null) {
        // Handle the object format { cursor, keys }
        // Use type assertion to avoid TypeScript errors
        const typedResult = result as { cursor: string | number, keys?: string[] };
        
        cursor = typeof typedResult.cursor === 'number' ? typedResult.cursor : 
                typeof typedResult.cursor === 'string' ? parseInt(typedResult.cursor) : 0;
        
        if (typedResult.keys && Array.isArray(typedResult.keys)) {
          keys = keys.concat(typedResult.keys);
        }
      } else {
        // If we can't determine the format, break the loop
        console.warn('Unexpected result format from redis.scan:', result);
        break;
      }
    } while (cursor !== 0);
    
    // Delete all found keys
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[CACHE INVALIDATED] Cleared ${keys.length} keys matching pattern ${pattern}`);
    } else {
      console.log(`No keys found matching pattern ${pattern}`);
    }
    
    return true;
  } catch (error) {
    console.warn(`Failed to invalidate cache by pattern ${pattern}:`, error);
    return false;
  }
}

export default redis;
