import { getRedis } from '../config/redis.js'

const OTP_PREFIX = 'otp:'
const OTP_TTL_SECONDS = 10 * 60 // 10 minutes
const MAX_ATTEMPTS = 5

interface OTPEntry {
  otp: string
  attempts: number
}

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const storeOTP = async (contact: string, otp: string): Promise<void> => {
  const entry: OTPEntry = { otp, attempts: 0 }
  await getRedis().set(
    `${OTP_PREFIX}${contact}`,
    JSON.stringify(entry),
    'EX',
    OTP_TTL_SECONDS
  )
}

export const verifyOTP = async (contact: string, otp: string): Promise<boolean> => {
  const redis = getRedis()
  const key = `${OTP_PREFIX}${contact}`

  const raw = await redis.get(key)
  if (!raw) return false // expired or never sent

  const stored: OTPEntry = JSON.parse(raw)

  // Brute-force lockout
  if (stored.attempts >= MAX_ATTEMPTS) {
    await redis.del(key) // invalidate after too many attempts
    return false
  }

  if (stored.otp === otp) {
    await redis.del(key) // single-use: delete on success
    return true
  }

  // Wrong guess — increment attempt counter and re-save with original TTL
  stored.attempts += 1
  const remainingTtl = await redis.ttl(key)
  if (remainingTtl > 0) {
    await redis.set(key, JSON.stringify(stored), 'EX', remainingTtl)
  }

  return false
}
