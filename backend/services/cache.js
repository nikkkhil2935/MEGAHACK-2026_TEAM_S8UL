import { createClient } from 'redis'

// Create Redis client
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})

// Log connection status
redis.on('connect', () => {
  console.log('✅ Redis connected — caching is ON')
})

redis.on('error', (err) => {
  console.warn('⚠️  Redis not available — caching is OFF:', err.message)
})

// Connect to Redis
// Even if this fails, your app will still work — just without caching
redis.connect().catch((err) => {
  console.warn('Redis unavailable, running without cache:', err.message)
})

/**
 * GET a value from cache
 * Returns the cached value, or null if not found
 */
export const cacheGet = async (key) => {
  try {
    const value = await redis.get(key)
    if (value) {
      console.log(`📦 Cache HIT → ${key}`)
      return JSON.parse(value)
    }
    console.log(`❌ Cache MISS → ${key}`)
    return null
  } catch {
    return null  // if Redis is down, just return null — app keeps working
  }
}

/**
 * SET a value in cache
 * ttlSeconds = how long to keep it (default: 1 hour)
 */
export const cacheSet = async (key, value, ttlSeconds = 3600) => {
  try {
    await redis.setEx(key, ttlSeconds, JSON.stringify(value))
    console.log(`💾 Cached → ${key} (expires in ${ttlSeconds}s)`)
  } catch {
    // if Redis is down, silently skip — never crash the app
  }
}

/**
 * DELETE a value from cache
 * Use this when underlying data changes
 */
export const cacheDel = async (key) => {
  try {
    await redis.del(key)
    console.log(`🗑️  Cache cleared → ${key}`)
  } catch {
    // silently skip
  }
}

export default redis
