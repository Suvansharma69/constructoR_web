import express from 'express'
import Project from '../models/Project.js'
import Bid from '../models/Bid.js'
import { AuthRequest, authenticate } from '../middleware/auth.js'

const router = express.Router()

// Create project
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { project_type, city, budget_range, description, plot_size, floors } = req.body

    if (!project_type || !city) {
      return res.status(400).json({ detail: 'project_type and city are required' })
    }

    const project = new Project({
      user_id: req.userId,
      project_type,
      city,
      budget_range: budget_range || undefined,
      description: description || undefined,
      plot_size: plot_size ? parseFloat(plot_size) : undefined,
      floors: floors ? parseInt(floors) : undefined,
    })

    await project.save()
    res.json(project)
  } catch (error) {
    console.error('Create project error:', error)
    res.status(500).json({ detail: 'Failed to create project' })
  }
})

// Get user's projects — only owner can view their own
router.get('/user/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ detail: 'Forbidden' })
    }
    const projects = await Project.find({ user_id: req.params.id }).sort({ created_at: -1 })
    res.json(projects)
  } catch (error) {
    console.error('Get user projects error:', error)
    res.status(500).json({ detail: 'Failed to get projects' })
  }
})

// Get available projects for professionals (filtered by city optionally)
router.get('/available/:role', authenticate, async (req: AuthRequest, res) => {
  try {
    const { role } = req.params
    const cityRaw = req.query.city
    const city = typeof cityRaw === 'string' ? cityRaw.trim() : undefined

    // Map professional roles to the project types they can handle
    const projectTypeMap: Record<string, string[]> = {
      architect:         ['build', 'renovate'],
      contractor:        ['build', 'renovate'],
      interior_designer: ['build', 'renovate'],
    }

    const query: any = {
      status: 'pending',
      project_type: { $in: projectTypeMap[role] || [] },
    }

    if (city) {
      const escaped = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.city = { $regex: escaped, $options: 'i' }
    }

    const projects = await Project.find(query)
      .populate('user_id', 'profile')
      .sort({ created_at: -1 })

    res.json(projects)
  } catch (error) {
    console.error('Get available projects error:', error)
    res.status(500).json({ detail: 'Failed to get projects' })
  }
})

// Submit bid on project
router.post('/:id/bid', authenticate, async (req: AuthRequest, res) => {
  try {
    // Accept both naming conventions from frontend
    const proposal = req.body.proposal || req.body.message
    const estimated_cost = req.body.estimated_cost || req.body.proposed_fee
    const estimated_days = req.body.estimated_days || 30 // default to 30 days if not provided

    if (!proposal) {
      return res.status(400).json({ detail: 'proposal / message is required' })
    }
    if (!estimated_cost) {
      return res.status(400).json({ detail: 'estimated_cost / proposed_fee is required' })
    }

    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ detail: 'Project not found' })
    }

    // Check if already bid
    const existingBid = await Bid.findOne({
      project_id: req.params.id,
      professional_id: req.userId,
    })

    if (existingBid) {
      return res.status(400).json({ detail: 'You have already bid on this project' })
    }

    const bid = new Bid({
      project_id: req.params.id,
      professional_id: req.userId,
      proposal,
      estimated_cost: parseFloat(estimated_cost),
      estimated_days: parseInt(estimated_days),
    })

    await bid.save()
    res.json(bid)
  } catch (error) {
    console.error('Submit bid error:', error)
    res.status(500).json({ detail: 'Failed to submit bid' })
  }
})

export default router
