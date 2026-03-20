import express from 'express'
import User from '../models/User.js'

const router = express.Router()

// Get professionals by role
router.get('/:role', async (req, res) => {
  try {
    const { role } = req.params
    const { city } = req.query

    const validRoles = ['architect', 'contractor', 'interior_designer']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ detail: 'Invalid role' })
    }

    const query: any = {
      role,
      profile_completed: true,
    }

    if (city) {
      query['profile.city'] = { $regex: city, $options: 'i' }
    }

    const professionals = await User.find(query).select('-contact')

    res.json(professionals)
  } catch (error) {
    console.error('Get professionals error:', error)
    res.status(500).json({ detail: 'Failed to get professionals' })
  }
})

export default router
