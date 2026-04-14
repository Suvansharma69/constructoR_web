import express from 'express'
import Material from '../models/Material.js'
import { AuthRequest, authenticate } from '../middleware/auth.js'
import { uploadMultiple } from '../middleware/upload.js'

const router = express.Router()

// Get all materials
router.get('/', async (req, res) => {
  try {
    const { category, brand } = req.query

    const query: any = { in_stock: true }

    if (category && typeof category === 'string') {
      query.category = category
    }
    if (brand && typeof brand === 'string') {
      // Escape special regex chars to prevent ReDoS
      const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.brand = { $regex: escaped, $options: 'i' }
    }

    const materials = await Material.find(query)
      .populate('vendor_id', 'profile')
      .sort({ created_at: -1 })

    res.json(materials)
  } catch (error) {
    console.error('Get materials error:', error)
    res.status(500).json({ detail: 'Failed to get materials' })
  }
})

// Get vendor's materials
router.get('/vendor/:id', async (req, res) => {
  try {
    const materials = await Material.find({ vendor_id: req.params.id })
      .sort({ created_at: -1 })
    res.json(materials)
  } catch (error) {
    console.error('Get vendor materials error:', error)
    res.status(500).json({ detail: 'Failed to get materials' })
  }
})

// Create material
router.post('/', authenticate, uploadMultiple, async (req: AuthRequest, res) => {
  try {
    const { name, category, brand, price, unit, description, stock } = req.body

    if (!name || !category || !price || !unit || !stock) {
      return res.status(400).json({ detail: 'Required fields: name, category, price, unit, stock' })
    }

    const images: string[] = []
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        images.push(`/uploads/materials/${file.filename}`)
      })
    }

    const material = new Material({
      vendor_id: req.userId,
      name,
      category,
      brand,
      price: parseFloat(price),
      unit,
      description,
      stock: parseInt(stock),
      in_stock: parseInt(stock) > 0,
      images,
    })

    await material.save()
    res.json(material)
  } catch (error) {
    console.error('Create material error:', error)
    res.status(500).json({ detail: 'Failed to create material' })
  }
})

// Update material
router.put('/:id', authenticate, uploadMultiple, async (req: AuthRequest, res) => {
  try {
    const material = await Material.findById(req.params.id)
    if (!material) {
      return res.status(404).json({ detail: 'Material not found' })
    }

    // Check ownership
    if (material.vendor_id.toString() !== req.userId) {
      return res.status(403).json({ detail: 'Not authorized' })
    }

    const { name, category, brand, price, unit, description, stock } = req.body

    if (name) material.name = name
    if (category) material.category = category
    if (brand) material.brand = brand
    if (price) material.price = parseFloat(price)
    if (unit) material.unit = unit
    if (description) material.description = description
    if (stock !== undefined) {
      material.stock = parseInt(stock)
      material.in_stock = parseInt(stock) > 0
    }

    // Add new images
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/materials/${file.filename}`)
      material.images = [...material.images, ...newImages]
    }

    await material.save()
    res.json(material)
  } catch (error) {
    console.error('Update material error:', error)
    res.status(500).json({ detail: 'Failed to update material' })
  }
})

// Delete material
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const material = await Material.findById(req.params.id)
    if (!material) {
      return res.status(404).json({ detail: 'Material not found' })
    }

    // Check ownership
    if (material.vendor_id.toString() !== req.userId) {
      return res.status(403).json({ detail: 'Not authorized' })
    }

    await Material.findByIdAndDelete(req.params.id)
    res.json({ message: 'Material deleted successfully' })
  } catch (error) {
    console.error('Delete material error:', error)
    res.status(500).json({ detail: 'Failed to delete material' })
  }
})

export default router
