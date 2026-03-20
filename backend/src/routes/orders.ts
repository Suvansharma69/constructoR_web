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

    if (!delivery_address) {
      return res.status(400).json({ detail: 'Delivery address is required' })
    }

    // Calculate total and validate materials
    let total = 0
    for (const item of items) {
      const material = await Material.findById(item.material_id)
      if (!material) {
        return res.status(404).json({ detail: `Material ${item.material_id} not found` })
      }
      if (material.stock < item.quantity) {
        return res.status(400).json({ detail: `Insufficient stock for ${material.name}` })
      }
      total += material.price * item.quantity

      // Update stock
      material.stock -= item.quantity
      material.in_stock = material.stock > 0
      await material.save()
    }

    const order = new Order({
      user_id: req.userId,
      items,
      delivery_address,
      total_amount: total,
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

// Get user's orders
router.get('/user/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const orders = await Order.find({ user_id: req.params.id })
      .populate('items.material_id')
      .sort({ created_at: -1 })
    res.json(orders)
  } catch (error) {
    console.error('Get user orders error:', error)
    res.status(500).json({ detail: 'Failed to get orders' })
  }
})

// Get vendor's orders
router.get('/vendor/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // Find all orders containing materials from this vendor
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

// Update order status
router.put('/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body

    const validStatuses = ['pending', 'processing', 'delivered', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ detail: 'Invalid status' })
    }

    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ detail: 'Order not found' })
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
