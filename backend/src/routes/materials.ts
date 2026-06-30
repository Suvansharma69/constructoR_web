import express, { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import Material from '../models/Material.js'
import User from '../models/User.js'
import { AuthRequest, authenticate } from '../middleware/auth.js'

const router = express.Router()

const validate = (req: Request, res: Response): boolean => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ detail: errors.array()[0].msg })
    return false
  }
  return true
}

// ─── Get all materials (public) ───────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, brand } = req.query
    const query: any = { in_stock: true }

    if (category && typeof category === 'string') {
      const allowedCategories = ['Cement','Steel','Bricks','Tiles','Electrical','Plumbing','Paint','Hardware','Flooring','Doors & Windows']
      if (allowedCategories.includes(category)) query.category = category
    }
    if (brand && typeof brand === 'string' && brand.length <= 100) {
      const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.brand = { $regex: escaped, $options: 'i' }
    }

    const materials = await Material.find(query)
      .populate('vendor_id', 'profile')
      .sort({ created_at: -1 })
      .limit(200)

    const result = materials.map((m: any) => {
      const obj = m.toObject()
      const vendor = obj.vendor_id
      obj.vendor_name = vendor?.profile?.shop_name || vendor?.profile?.name || undefined
      obj.city = vendor?.profile?.city || undefined
      obj.vendor_id = vendor?._id || obj.vendor_id
      return obj
    })

    res.json(result)
  } catch (error) {
    console.error('Get materials error:', error)
    res.status(500).json({ detail: 'Failed to get materials' })
  }
})

// ─── Get vendor's materials ───────────────────────────────────────────────────
router.get('/vendor/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ detail: 'Forbidden' })
    }
    const materials = await Material.find({ vendor_id: req.params.id })
      .sort({ created_at: -1 })
      .limit(200)
    res.json(materials)
  } catch (error) {
    console.error('Get vendor materials error:', error)
    res.status(500).json({ detail: 'Failed to get materials' })
  }
})

// ─── Create material ──────────────────────────────────────────────────────────
router.post('/', authenticate, [
  body('name').isString().isLength({ min: 1, max: 200 }).trim().withMessage('Name is required (max 200 chars)'),
  body('category').isIn(['Cement','Steel','Bricks','Tiles','Electrical','Plumbing','Paint','Hardware','Flooring','Doors & Windows']).withMessage('Invalid category'),
  body('price').isFloat({ min: 0, max: 10000000 }).withMessage('Price must be a positive number'),
  body('unit').isIn(['piece','bag','ton','kg','meter','sqft','liter','box','set']).withMessage('Invalid unit'),
  body('brand').optional().isString().isLength({ max: 100 }).trim(),
  body('description').optional().isString().isLength({ max: 2000 }).trim(),
  body('stock').optional().isInt({ min: 0, max: 1000000 }),
  body('in_stock').optional().isBoolean(),
], async (req: AuthRequest, res: Response) => {
  if (!validate(req, res)) return

  try {
    const user = await User.findById(req.userId).select('role')
    if (!user || user.role !== 'vendor') {
      return res.status(403).json({ detail: 'Only vendors can create materials' })
    }

    const { name, category, brand, price, unit, description, stock, in_stock } = req.body

    const stockNum = (stock !== undefined && stock !== null && stock !== '') ? parseInt(stock) : 0
    const inStockVal = in_stock !== undefined ? Boolean(in_stock) : stockNum > 0

    const material = new Material({
      vendor_id: req.userId,
      name: name.trim(),
      category,
      brand: brand?.trim() || undefined,
      price: parseFloat(price),
      unit,
      description: description?.trim() || undefined,
      stock: stockNum,
      in_stock: inStockVal,
      images: [],
    })

    await material.save()
    res.json(material)
  } catch (error) {
    console.error('Create material error:', error)
    res.status(500).json({ detail: 'Failed to create material' })
  }
})

// ─── Update material ──────────────────────────────────────────────────────────
router.put('/:id', authenticate, [
  body('name').optional().isString().isLength({ min: 1, max: 200 }).trim(),
  body('category').optional().isIn(['Cement','Steel','Bricks','Tiles','Electrical','Plumbing','Paint','Hardware','Flooring','Doors & Windows']),
  body('price').optional().isFloat({ min: 0, max: 10000000 }),
  body('unit').optional().isIn(['piece','bag','ton','kg','meter','sqft','liter','box','set']),
  body('brand').optional().isString().isLength({ max: 100 }).trim(),
  body('description').optional().isString().isLength({ max: 2000 }).trim(),
  body('stock').optional().isInt({ min: 0, max: 1000000 }),
  body('in_stock').optional().isBoolean(),
], async (req: AuthRequest, res: Response) => {
  if (!validate(req, res)) return

  try {
    const user = await User.findById(req.userId).select('role')
    if (!user || user.role !== 'vendor') {
      return res.status(403).json({ detail: 'Only vendors can update materials' })
    }

    const material = await Material.findById(req.params.id)
    if (!material) return res.status(404).json({ detail: 'Material not found' })
    if (material.vendor_id.toString() !== req.userId) return res.status(403).json({ detail: 'Not authorized' })

    const { name, category, brand, price, unit, description, stock, in_stock } = req.body

    if (name) material.name = name.trim()
    if (category) material.category = category
    if (brand !== undefined) material.brand = brand?.trim() || undefined
    if (price !== undefined) material.price = parseFloat(price)
    if (unit) material.unit = unit
    if (description !== undefined) material.description = description?.trim() || undefined
    if (stock !== undefined) {
      material.stock = parseInt(stock)
      material.in_stock = parseInt(stock) > 0
    }
    if (in_stock !== undefined) material.in_stock = Boolean(in_stock)

    await material.save()
    res.json(material)
  } catch (error) {
    console.error('Update material error:', error)
    res.status(500).json({ detail: 'Failed to update material' })
  }
})

// ─── Delete material ──────────────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId).select('role')
    if (!user || user.role !== 'vendor') {
      return res.status(403).json({ detail: 'Only vendors can delete materials' })
    }

    const material = await Material.findById(req.params.id)
    if (!material) return res.status(404).json({ detail: 'Material not found' })
    if (material.vendor_id.toString() !== req.userId) return res.status(403).json({ detail: 'Not authorized' })

    await Material.findByIdAndDelete(req.params.id)
    res.json({ message: 'Material deleted successfully' })
  } catch (error) {
    console.error('Delete material error:', error)
    res.status(500).json({ detail: 'Failed to delete material' })
  }
})

export default router
