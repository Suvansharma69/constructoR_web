import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt.js'

export interface AuthRequest extends Request {
  userId?: string
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ detail: 'No token provided' })
      return
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      res.status(401).json({ detail: 'Invalid or expired token' })
      return
    }

    req.userId = decoded.userId
    next()
  } catch (error) {
    res.status(401).json({ detail: 'Authentication failed' })
  }
}
