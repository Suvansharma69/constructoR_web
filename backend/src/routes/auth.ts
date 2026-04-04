import express from 'express'
import User from '../models/User.js'
import { generateOTP, storeOTP, verifyOTP as verifyOTPUtil } from '../utils/otp.js'
import { generateToken } from '../utils/jwt.js'
import admin from 'firebase-admin'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Firebase Admin SDK
const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json')
if (!admin.apps.length) {
  try {
    if (existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
      console.log('🔥 Firebase Admin SDK initialized')
    } else {
      console.warn('⚠️ firebase-service-account.json not found, Firebase auth disabled')
    }
  } catch (err) {
    console.error('Firebase Admin init error:', err)
  }
}

const router = express.Router()

// Firebase Login — verify token and create/login user
router.post('/firebase-login', async (req, res) => {
  try {
    const { idToken, role, name } = req.body

    if (!idToken || !role) {
      return res.status(400).json({ detail: 'idToken and role are required' })
    }

    // Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken)
    const firebase_uid = decoded.uid
    const email = decoded.email || ''
    const email_verified = decoded.email_verified || false

    // Find user by firebase_uid or email
    let user = await User.findOne({ firebase_uid })
    if (!user && email) {
      user = await User.findOne({ contact: email })
    }

    if (!user) {
      // Create new user
      user = new User({
        firebase_uid,
        contact: email,
        contact_type: 'email',
        role,
        profile_completed: false,
        email_verified,
        profile: name ? { name } : {},
      })
      await user.save()
    } else {
      // Update firebase_uid + email_verified
      user.firebase_uid = firebase_uid
      user.email_verified = email_verified

      // If role changed, reset profile
      if (user.role !== role) {
        user.role = role as any
        user.profile_completed = false
        user.profile = name ? { name } as any : {} as any
      } else if (name && !user.profile?.name) {
        user.profile = { ...user.profile, name } as any
      }

      await user.save()
    }

    const token = generateToken(user._id.toString())

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        contact: user.contact,
        contact_type: user.contact_type,
        role: user.role,
        profile_completed: user.profile_completed,
        email_verified: user.email_verified,
        profile: user.profile || {},
      },
    })
  } catch (error: any) {
    console.error('Firebase login error:', error)
    if (error.code?.startsWith('auth/')) {
      return res.status(401).json({ detail: `Firebase auth error: ${error.message}` })
    }
    res.status(400).json({ detail: error.message || 'Firebase login failed' })
  }
})

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { contact, contact_type } = req.body

    if (!contact || !contact_type) {
      return res.status(400).json({ detail: 'Contact and contact_type are required' })
    }

    const otp = generateOTP()
    storeOTP(contact, otp)

    // In production, send actual OTP via SMS/Email
    console.log(`📱 OTP for ${contact}: ${otp}`)

    res.json({
      message: 'OTP sent successfully',
      // Only expose OTP in development — never in production
      ...(process.env.NODE_ENV !== 'production' && { mock_otp: otp }),
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    res.status(500).json({ detail: 'Failed to send OTP' })
  }
})

// Verify OTP and login/register
router.post('/verify-otp', async (req, res) => {
  try {
    const { contact, otp, role } = req.body

    if (!contact || !otp || !role) {
      return res.status(400).json({ detail: 'Contact, OTP, and role are required' })
    }

    // Verify OTP
    const isValid = verifyOTPUtil(contact, otp)
    if (!isValid) {
      return res.status(400).json({ detail: 'Invalid or expired OTP' })
    }

    // Find or create user
    let user = await User.findOne({ contact })

    if (!user) {
      // Create new user
      const contactType = contact.includes('@') ? 'email' : 'phone'
      user = new User({
        contact,
        contact_type: contactType,
        role,
        profile_completed: false,
      })
      await user.save()
    }

    // Generate JWT token
    const token = generateToken(user._id.toString())

    res.json({
      token,
      user: {
        _id: user._id,
        contact: user.contact,
        contact_type: user.contact_type,
        role: user.role,
        profile_completed: user.profile_completed,
        profile: user.profile || {},
      },
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ detail: 'Failed to verify OTP' })
  }
})

// Get user by ID
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ detail: 'User not found' })
    }

    res.json({
      _id: user._id,
      contact: user.contact,
      contact_type: user.contact_type,
      role: user.role,
      profile_completed: user.profile_completed,
      profile: user.profile || {},
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ detail: 'Failed to get user' })
  }
})

export default router
