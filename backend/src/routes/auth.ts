import express, { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import rateLimit from 'express-rate-limit'
import User from '../models/User.js'
import { generateOTP, storeOTP, verifyOTP as verifyOTPUtil } from '../utils/otp.js'
import { generateToken } from '../utils/jwt.js'
import admin from 'firebase-admin'
import { authenticate, AuthRequest } from '../middleware/auth.js'

// ── OTP rate limiter: 10 OTPs per 10 min per IP ──────────────────────────────
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { detail: 'Too many OTP requests. Please wait 10 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// ── Initialize Firebase Admin SDK ─────────────────────────────────────────────
if (!admin.apps.length) {
  try {
    const credJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    if (credJson) {
      const serviceAccount = JSON.parse(credJson)
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
      console.log('🔥 Firebase Admin SDK initialized from env')
    } else {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_JSON not set, Firebase auth disabled')
    }
  } catch (err) {
    console.error('Firebase Admin init error:', err)
  }
}

const router = express.Router()

// ── Helpers ───────────────────────────────────────────────────────────────────
const ok = (req: Request, res: Response): boolean => {
  const errs = validationResult(req)
  if (!errs.isEmpty()) { res.status(400).json({ detail: errs.array()[0].msg }); return false }
  return true
}

const esc = (s: string) =>
  s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
   .replace(/"/g,'&quot;').replace(/'/g,'&#x27;')

const ROLES = ['homeowner','architect','contractor','interior_designer','vendor'] as const

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/firebase-login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/firebase-login', [
  body('idToken').isString().isLength({ min:10, max:4096 }).withMessage('Invalid Firebase token'),
  body('role').isIn(ROLES).withMessage('Invalid role'),
  body('name').optional().isString().isLength({ max:100 }).trim(),
], async (req: Request, res: Response) => {
  if (!ok(req, res)) return
  try {
    const { idToken, role, name } = req.body
    if (!admin.apps.length) return res.status(503).json({ detail: 'Firebase auth not configured' }) as any

    const decoded = await admin.auth().verifyIdToken(idToken)
    const firebase_uid = decoded.uid
    const email = decoded.email || ''
    const email_verified = decoded.email_verified || false
    const sanitizedName = name ? esc(name.trim()) : undefined

    let user = await User.findOne({ firebase_uid })
    if (!user && email) user = await User.findOne({ contact: email })

    if (!user) {
      user = new User({ firebase_uid, contact: email, contact_type: 'email', role,
        profile_completed: false, email_verified,
        profile: sanitizedName ? { name: sanitizedName } : {} })
      await user.save()
    } else {
      user.firebase_uid = firebase_uid
      user.email_verified = email_verified
      if (user.role !== role) {
        user.role = role as any
        user.profile_completed = false
        user.profile = sanitizedName ? { name: sanitizedName } as any : {} as any
      } else if (sanitizedName && !user.profile?.name) {
        user.profile = { ...user.profile, name: sanitizedName } as any
      }
      await user.save()
    }

    const token = generateToken(user._id.toString())
    res.json({ success: true, token, user: {
      _id: user._id, contact: user.contact, contact_type: user.contact_type,
      role: user.role, profile_completed: user.profile_completed,
      email_verified: user.email_verified, profile: user.profile || {},
    }})
  } catch (error: any) {
    console.error('Firebase login error:', error)
    if (error.code?.startsWith('auth/')) return res.status(401).json({ detail: `Firebase auth error: ${error.message}` }) as any
    res.status(400).json({ detail: error.message || 'Firebase login failed' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/send-otp
// ─────────────────────────────────────────────────────────────────────────────
router.post('/send-otp', otpLimiter, [
  body('contact').isString().isLength({ min:5, max:200 }).trim().withMessage('Contact must be 5-200 characters'),
  body('contact_type').isIn(['phone','email']).withMessage('contact_type must be phone or email'),
], async (req: Request, res: Response) => {
  if (!ok(req, res)) return
  try {
    const { contact, contact_type } = req.body
    const trimmed = contact.trim()
    if (contact_type === 'phone' && !/^\d{10}$/.test(trimmed))
      return res.status(400).json({ detail: 'Phone must be a 10-digit number' }) as any
    if (contact_type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
      return res.status(400).json({ detail: 'Invalid email address' }) as any

    const otp = generateOTP()
    await storeOTP(trimmed, otp)
    if (process.env.NODE_ENV !== 'production') console.log(`📱 DEV OTP for ${trimmed}: ${otp}`)

    res.json({ message: 'OTP sent successfully',
      ...(process.env.NODE_ENV !== 'production' && { mock_otp: otp }) })
  } catch (error) {
    console.error('Send OTP error:', error)
    res.status(500).json({ detail: 'Failed to send OTP' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify-otp', [
  body('contact').isString().isLength({ min:5, max:200 }).trim().withMessage('Valid contact required'),
  body('otp').isString().matches(/^\d{6}$/).withMessage('OTP must be 6 digits'),
  body('role').isIn(ROLES).withMessage('Invalid role'),
], async (req: Request, res: Response) => {
  if (!ok(req, res)) return
  try {
    const { contact, otp, role } = req.body
    const trimmed = contact.trim()
    if (!await verifyOTPUtil(trimmed, otp)) return res.status(400).json({ detail: 'Invalid or expired OTP' }) as any

    let user = await User.findOne({ contact: trimmed })
    if (!user) {
      user = new User({ contact: trimmed, contact_type: trimmed.includes('@') ? 'email' : 'phone',
        role, profile_completed: false })
      await user.save()
    }

    const token = generateToken(user._id.toString())
    res.json({ token, user: {
      _id: user._id, contact: user.contact, contact_type: user.contact_type,
      role: user.role, profile_completed: user.profile_completed, profile: user.profile || {},
    }})
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ detail: 'Failed to verify OTP' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/user/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/user/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userId !== req.params.id) return res.status(403).json({ detail: 'Forbidden' }) as any
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ detail: 'User not found' }) as any
    res.json({ _id: user._id, contact: user.contact, contact_type: user.contact_type,
      role: user.role, profile_completed: user.profile_completed, profile: user.profile || {} })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ detail: 'Failed to get user' })
  }
})

export default router
