// Simple OTP storage (in production, use Redis or MongoDB with TTL)
interface OTPEntry {
  otp: string
  expires: number
  attempts: number // brute-force protection
}

interface OTPStore {
  [contact: string]: OTPEntry
}

const MAX_ATTEMPTS = 5
const otpStore: OTPStore = {}

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const storeOTP = (contact: string, otp: string): void => {
  otpStore[contact] = {
    otp,
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
  }
}

export const verifyOTP = (contact: string, otp: string): boolean => {
  const stored = otpStore[contact]
  if (!stored) return false

  // Expired
  if (Date.now() > stored.expires) {
    delete otpStore[contact]
    return false
  }

  // Brute-force lockout: too many wrong attempts
  if (stored.attempts >= MAX_ATTEMPTS) {
    delete otpStore[contact]
    return false
  }

  if (stored.otp === otp) {
    delete otpStore[contact] // single-use
    return true
  }

  // Wrong guess — increment attempt counter
  stored.attempts += 1
  return false
}

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const contact in otpStore) {
    if (otpStore[contact].expires < now) {
      delete otpStore[contact]
    }
  }
}, 5 * 60 * 1000)
