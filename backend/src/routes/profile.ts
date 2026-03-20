import express from 'express'
import User from '../models/User.js'
import { uploadSingle, uploadMultiple } from '../middleware/upload.js'
import { AuthRequest, authenticate } from '../middleware/auth.js'

const router = express.Router()

// Update user profile (homeowner)
router.post('/user/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, city } = req.body

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ detail: 'User not found' })
    }

    user.profile = { ...user.profile, name, city }
    user.profile_completed = true
    await user.save()

    res.json({
      _id: user._id,
      contact: user.contact,
      contact_type: user.contact_type,
      role: user.role,
      profile_completed: user.profile_completed,
      profile: user.profile,
    })
  } catch (error) {
    console.error('Update user profile error:', error)
    res.status(500).json({ detail: 'Failed to update profile' })
  }
})

// Update professional profile
router.post('/professional/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, city, experience, specializations, price_range, consultation_fee } = req.body

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ detail: 'User not found' })
    }

    user.profile = {
      ...user.profile,
      name,
      city,
      experience: experience ? parseInt(experience) : undefined,
      specializations: specializations ? JSON.parse(specializations) : undefined,
      price_range,
      consultation_fee: consultation_fee ? parseFloat(consultation_fee) : undefined,
    }
    user.profile_completed = true
    await user.save()

    res.json({
      _id: user._id,
      contact: user.contact,
      contact_type: user.contact_type,
      role: user.role,
      profile_completed: user.profile_completed,
      profile: user.profile,
    })
  } catch (error) {
    console.error('Update professional profile error:', error)
    res.status(500).json({ detail: 'Failed to update profile' })
  }
})

// Update vendor profile
router.post('/vendor/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { shop_name, owner_name, city, address, gst_number } = req.body

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ detail: 'User not found' })
    }

    user.profile = {
      ...user.profile,
      shop_name,
      owner_name,
      city,
      address,
      gst_number,
    }
    user.profile_completed = true
    await user.save()

    res.json({
      _id: user._id,
      contact: user.contact,
      contact_type: user.contact_type,
      role: user.role,
      profile_completed: user.profile_completed,
      profile: user.profile,
    })
  } catch (error) {
    console.error('Update vendor profile error:', error)
    res.status(500).json({ detail: 'Failed to update profile' })
  }
})

// Upload profile avatar
router.post('/upload-avatar/:id', authenticate, uploadSingle, async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' })
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ detail: 'User not found' })
    }

    // Save the file URL
    const avatarUrl = `/uploads/profiles/${req.file.filename}`
    user.profile = { ...user.profile, avatar: avatarUrl }
    await user.save()

    res.json({
      avatar: avatarUrl,
      message: 'Avatar uploaded successfully',
    })
  } catch (error) {
    console.error('Upload avatar error:', error)
    res.status(500).json({ detail: 'Failed to upload avatar' })
  }
})

// Upload portfolio images
router.post('/upload-portfolio/:id', authenticate, uploadMultiple, async (req: AuthRequest, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ detail: 'No files uploaded' })
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ detail: 'User not found' })
    }

    // Save portfolio image URLs
    const portfolioUrls = req.files.map(file => `/uploads/portfolios/${file.filename}`)
    user.profile = {
      ...user.profile,
      portfolio_images: [...(user.profile?.portfolio_images || []), ...portfolioUrls],
    }
    await user.save()

    res.json({
      portfolio_images: portfolioUrls,
      message: 'Portfolio images uploaded successfully',
    })
  } catch (error) {
    console.error('Upload portfolio error:', error)
    res.status(500).json({ detail: 'Failed to upload portfolio images' })
  }
})

export default router
