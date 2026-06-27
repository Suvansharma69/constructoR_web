import { Redis } from 'ioredis'

let redisClient: Redis | null = null

export const getRedis = (): Redis => {
  if (redisClient) return redisClient

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 5) {
        console.error('❌ Redis: too many retries, giving up')
        return null // stop retrying
      }
      return Math.min(times * 200, 2000) // exponential backoff up to 2s
    },
    lazyConnect: true,
  })

  redisClient.on('connect', () => console.log('✅ Redis connected'))
  redisClient.on('error', (err: Error) => console.error('❌ Redis error:', err.message))
  redisClient.on('reconnecting', () => console.warn('⚠️  Redis reconnecting...'))
  redisClient.on('close', () => console.warn('⚠️  Redis connection closed'))

  return redisClient
}

export const connectRedis = async (): Promise<void> => {
  const client = getRedis()
  try {
    await client.connect()
  } catch (err: any) {
    console.error('❌ Redis initial connection failed:', err.message)
    // Non-fatal in dev — comment out and process.exit(1) for strict prod
  }
}
