import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

// Fail fast at startup if secret is not configured
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.')
}

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' })
}

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}
