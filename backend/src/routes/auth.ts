import express from 'express'
import User from '../models/User.js'
import { generateOTP, storeOTP, verifyOTP as verifyOTPUtil } from '../utils/otp.js'
import { generateToken } from '../utils/jwt.js'

const router = express.Router()

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
      mock_otp: otp, // Only for development
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
