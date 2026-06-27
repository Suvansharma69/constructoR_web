import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_ALGORITHM = 'HS256' as const
const TOKEN_EXPIRY = '30d'

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('FATAL: JWT_SECRET must be set and at least 32 characters long.')
}

// ── In-memory token blacklist (for logout / forced invalidation) ──────────────
// In production, use Redis with TTL matching the token expiry
const blacklistedJtis = new Set<string>()

// Prune stale entries every hour to prevent unbounded growth
setInterval(() => {
  // We can't easily prune without decoding, so keep a size cap
  if (blacklistedJtis.size > 10000) blacklistedJtis.clear()
}, 60 * 60 * 1000)

export const generateToken = (userId: string): string => {
  const jti = crypto.randomBytes(16).toString('hex') // unique token ID
  return jwt.sign({ userId, jti }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
    algorithm: JWT_ALGORITHM,
  })
}

export const verifyToken = (token: string): { userId: string; jti: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    }) as { userId: string; jti: string }

    // Check blacklist
    if (blacklistedJtis.has(decoded.jti)) return null

    return decoded
  } catch {
    return null
  }
}

/** Call this on logout to invalidate the specific token */
export const blacklistToken = (token: string): void => {
  try {
    const decoded = jwt.decode(token) as { jti?: string } | null
    if (decoded?.jti) blacklistedJtis.add(decoded.jti)
  } catch { /* ignore */ }
}
