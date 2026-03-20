// Simple OTP storage (in production, use Redis or MongoDB with TTL)
interface OTPStore {
  [contact: string]: {
    otp: string
    expires: number
  }
}

const otpStore: OTPStore = {}

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const storeOTP = (contact: string, otp: string): void => {
  otpStore[contact] = {
    otp,
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes
  }
}

export const verifyOTP = (contact: string, otp: string): boolean => {
  const stored = otpStore[contact]
  if (!stored) return false
  if (Date.now() > stored.expires) {
    delete otpStore[contact]
    return false
  }
  if (stored.otp === otp) {
    delete otpStore[contact]
    return true
  }
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

