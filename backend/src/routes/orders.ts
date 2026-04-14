import express from 'express'
import Order from '../models/Order.js'
import Material from '../models/Material.js'
import { AuthRequest, authenticate } from '../middleware/auth.js'

const router = express.Router()

// Create order
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { items, delivery_address } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ detail: 'Items are required' })
    }
    if (items.length > 50) {
      return res.status(400).json({ detail: 'Too many items in one order (max 50)' })
    }
    if (!delivery_address || typeof delivery_address !== 'string' || delivery_address.trim().length < 10) {
      return res.status(400).json({ detail: 'Valid delivery address is required (min 10 chars)' })
    }

    // Calculate total server-side — never trust client-sent prices
    let total = 0
    for (const item of items) {
      if (!item.material_id || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ detail: 'Each item needs a valid material_id and quantity >= 1' })
      }
      const material = await Material.findById(item.material_id)
      if (!material) {
        return res.status(404).json({ detail: `Material ${item.material_id} not found` })
      }
      if (material.stock < item.quantity) {
        return res.status(400).json({ detail: `Insufficient stock for ${material.name}` })
      }
      // Use server-side price — ignore any price sent by client
      total += material.price * item.quantity

      // Update stock
      material.stock -= item.quantity
      material.in_stock = material.stock > 0
      await material.save()
    }

    const order = new Order({
      user_id: req.userId,
      items,
      delivery_address: delivery_address.trim(),
      total_amount: total, // always server-calculated
    })

    await order.save()

    const populatedOrder = await Order.findById(order._id)
      .populate('items.material_id')
      .populate('user_id', 'profile')

    res.json(populatedOrder)
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({ detail: 'Failed to create order' })
  }
})

// Get user's orders — only the owner can view their orders
router.get('/user/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // IDOR protection
    if (req.userId !== req.params.id) {
      return res.status(403).json({ detail: 'Forbidden' })
    }

    const orders = await Order.find({ user_id: req.params.id })
      .populate('items.material_id')
      .sort({ created_at: -1 })
    res.json(orders)
  } catch (error) {
    console.error('Get user orders error:', error)
    res.status(500).json({ detail: 'Failed to get orders' })
  }
})

// Get vendor's orders — only the vendor themselves
router.get('/vendor/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // IDOR protection
    if (req.userId !== req.params.id) {
      return res.status(403).json({ detail: 'Forbidden' })
    }

    const materials = await Material.find({ vendor_id: req.params.id }).select('_id')
    const materialIds = materials.map(m => m._id)

    const orders = await Order.find({
      'items.material_id': { $in: materialIds }
    })
      .populate('items.material_id')
      .populate('user_id', 'profile')
      .sort({ created_at: -1 })

    res.json(orders)
  } catch (error) {
    console.error('Get vendor orders error:', error)
    res.status(500).json({ detail: 'Failed to get orders' })
  }
})

// Update order status — only the vendor of that order's materials can update
router.put('/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body

    const validStatuses = ['pending', 'processing', 'delivered', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ detail: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
    }

    const order = await Order.findById(req.params.id).populate('items.material_id')
    if (!order) {
      return res.status(404).json({ detail: 'Order not found' })
    }

    // Only the buyer can cancel their own order, only a vendor whose material is in the order can update status
    const isBuyer = order.user_id.toString() === req.userId
    const isRelatedVendor = await Material.exists({
      _id: { $in: order.items.map((i: any) => i.material_id) },
      vendor_id: req.userId,
    })

    if (!isBuyer && !isRelatedVendor) {
      return res.status(403).json({ detail: 'Forbidden: not authorized to update this order' })
    }

    // Buyers can only cancel, vendors can update to processing/delivered
    if (isBuyer && status !== 'cancelled') {
      return res.status(403).json({ detail: 'Buyers can only cancel orders' })
    }

    order.status = status
    await order.save()

    const populatedOrder = await Order.findById(order._id)
      .populate('items.material_id')
      .populate('user_id', 'profile')

    res.json(populatedOrder)
  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({ detail: 'Failed to update order status' })
  }
})

export default router
