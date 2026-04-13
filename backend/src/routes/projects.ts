import express from 'express'
import Project from '../models/Project.js'
import Bid from '../models/Bid.js'
import { AuthRequest, authenticate } from '../middleware/auth.js'
import { uploadDocuments } from '../middleware/upload.js'

const router = express.Router()

// Create project
router.post('/', authenticate, uploadDocuments, async (req: AuthRequest, res) => {
  try {
    const { project_type, title, description, location, budget, timeline } = req.body

    if (!project_type || !title || !description || !location || !budget || !timeline) {
      return res.status(400).json({ detail: 'All fields are required' })
    }

    const images: string[] = []
    const documents: string[] = []

    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        const fileUrl = `/uploads/projects/${file.filename}`
        if (file.mimetype.startsWith('image/')) {
          images.push(fileUrl)
        } else {
          documents.push(fileUrl)
        }
      })
    }

    const project = new Project({
      user_id: req.userId,
      project_type,
      title,
      description,
      location,
      budget: parseFloat(budget),
      timeline,
      images,
      documents,
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

// Get available projects for professionals
router.get('/available/:role', authenticate, async (req: AuthRequest, res) => {
  try {
    const { role } = req.params
    // Cast location to string and escape for safe regex use
    const locationRaw = req.query.location
    const location = typeof locationRaw === 'string' ? locationRaw.trim() : undefined

    const projectTypeMap: Record<string, string[]> = {
      architect: ['new_construction', 'renovation', 'commercial'],
      contractor: ['new_construction', 'renovation', 'commercial'],
      interior_designer: ['interior_design', 'renovation'],
    }

    const query: any = {
      status: 'pending',
      project_type: { $in: projectTypeMap[role] || [] },
    }

    if (location) {
      // Escape special regex characters to prevent ReDoS
      const escaped = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.location = { $regex: escaped, $options: 'i' }
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
    const { proposal, estimated_cost, estimated_days } = req.body

    if (!proposal || !estimated_cost || !estimated_days) {
      return res.status(400).json({ detail: 'All fields are required' })
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
