import express from 'express'
import Order from '../models/Order.js'
import Material from '../models/Material.js'
import User from '../models/User.js'
import { AuthRequest, authenticate } from '../middleware/auth.js'

const router = express.Router()

router.post('/', authenticate, async (req: AuthRequest, res) => {
  const decrementedItems: { material_id: string; quantity: number }[] = []

  try {
    const user = await User.findById(req.userId).select('role')
    if (!user || user.role !== 'homeowner') {
      return res.status(403).json({ detail: 'Only homeowners can place material orders' })
    }

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

    let total = 0
    const orderItems: { material_id: string; quantity: number; price: number }[] = []

    for (const item of items) {
      const quantity = Number(item.quantity)
      if (!item.material_id || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ detail: 'Each item needs a valid material_id and quantity >= 1' })
      }

      const material = await Material.findById(item.material_id)
      if (!material) {
        return res.status(404).json({ detail: `Material ${item.material_id} not found` })
      }
      if (!material.in_stock || material.stock < quantity) {
        return res.status(400).json({ detail: `Insufficient stock for ${material.name} (available: ${material.stock})` })
      }

      const updatedMaterial = await Material.findOneAndUpdate(
        { _id: item.material_id, in_stock: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      )
      if (!updatedMaterial) {
        throw new Error(`Insufficient stock for ${material.name}`)
      }

      decrementedItems.push({ material_id: item.material_id, quantity })
      if (updatedMaterial.stock <= 0) {
        updatedMaterial.in_stock = false
        await updatedMaterial.save()
      }

      total += material.price * quantity
      orderItems.push({ material_id: item.material_id, quantity, price: material.price })
    }

    const order = new Order({
      user_id: req.userId,
      items: orderItems,
      delivery_address: delivery_address.trim(),
      total_amount: total,
    })

    await order.save()

    const populatedOrder = await Order.findById(order._id)
      .populate('items.material_id')
      .populate('user_id', 'profile')

    res.json(populatedOrder)
  } catch (error) {
    console.error('Create order error:', error)
    await Promise.all(decrementedItems.map(item =>
      Material.updateOne(
        { _id: item.material_id },
        { $inc: { stock: item.quantity }, $set: { in_stock: true } }
      )
    ))
    res.status(500).json({ detail: error instanceof Error ? error.message : 'Failed to create order' })
  }
})

router.get('/user/:id', authenticate, async (req: AuthRequest, res) => {
  try {
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

router.get('/vendor/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ detail: 'Forbidden' })
    }

    const user = await User.findById(req.userId).select('role')
    if (!user || user.role !== 'vendor') {
      return res.status(403).json({ detail: 'Only vendors can view vendor orders' })
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

    const isBuyer = order.user_id.toString() === req.userId
    const isRelatedVendor = await Material.exists({
      _id: { $in: order.items.map((i: any) => i.material_id) },
      vendor_id: req.userId,
    })

    if (!isBuyer && !isRelatedVendor) {
      return res.status(403).json({ detail: 'Forbidden: not authorized to update this order' })
    }
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
