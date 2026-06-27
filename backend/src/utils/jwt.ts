import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { getRedis } from '../config/redis.js'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_ALGORITHM = 'HS256' as const
const TOKEN_EXPIRY = '30d'
const TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60 // 30 days in seconds
const BLACKLIST_PREFIX = 'jwt_blacklist:'

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('FATAL: JWT_SECRET must be set and at least 32 characters long.')
}

export const generateToken = (userId: string): string => {
  const jti = crypto.randomBytes(16).toString('hex') // unique token ID
  return jwt.sign({ userId, jti }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
    algorithm: JWT_ALGORITHM,
  })
}

export const verifyToken = async (token: string): Promise<{ userId: string; jti: string } | null> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    }) as { userId: string; jti: string; exp: number }

    // Check Redis blacklist — O(1) lookup, key auto-expires with token
    const blacklisted = await getRedis().exists(`${BLACKLIST_PREFIX}${decoded.jti}`)
    if (blacklisted) return null

    return { userId: decoded.userId, jti: decoded.jti }
  } catch {
    return null
  }
}

/** Call this on logout — stores the jti in Redis with TTL matching the remaining token lifetime */
export const blacklistToken = async (token: string): Promise<void> => {
  try {
    const decoded = jwt.decode(token) as { jti?: string; exp?: number } | null
    if (!decoded?.jti) return

    // TTL = remaining seconds until token naturally expires (so Redis auto-cleans it)
    const now = Math.floor(Date.now() / 1000)
    const exp = decoded.exp ?? now + TOKEN_EXPIRY_SECONDS
    const ttl = Math.max(exp - now, 1)

    await getRedis().set(`${BLACKLIST_PREFIX}${decoded.jti}`, '1', 'EX', ttl)
  } catch {
    /* ignore — don't crash logout on Redis error */
  }
}
