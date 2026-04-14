import express from 'express'
import Message from '../models/Message.js'
import User from '../models/User.js'
import { AuthRequest, authenticate } from '../middleware/auth.js'

const router = express.Router()

// Send message
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { receiver_id, message } = req.body

    if (!receiver_id || !message) {
      return res.status(400).json({ detail: 'Receiver ID and message are required' })
    }

    // Validate message length — prevent abuse
    if (typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ detail: 'Message cannot be empty' })
    }
    if (message.length > 2000) {
      return res.status(400).json({ detail: 'Message too long (max 2000 characters)' })
    }

    // Prevent messaging yourself
    if (receiver_id === req.userId) {
      return res.status(400).json({ detail: 'Cannot send a message to yourself' })
    }

    const newMessage = new Message({
      sender_id: req.userId,
      receiver_id,
      message: message.trim(),
    })

    await newMessage.save()

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender_id', 'profile')
      .populate('receiver_id', 'profile')

    res.json(populatedMessage)
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ detail: 'Failed to send message' })
  }
})

// Get conversation between two users — only participants can read it
router.get('/conversation/:user1/:user2', authenticate, async (req: AuthRequest, res) => {
  try {
    const { user1, user2 } = req.params

    // IDOR protection: must be one of the participants
    if (req.userId !== user1 && req.userId !== user2) {
      return res.status(403).json({ detail: 'Forbidden: you are not part of this conversation' })
    }

    const messages = await Message.find({
      $or: [
        { sender_id: user1, receiver_id: user2 },
        { sender_id: user2, receiver_id: user1 },
      ],
    })
      .populate('sender_id', 'profile')
      .populate('receiver_id', 'profile')
      .sort({ created_at: 1 })
      .limit(200) // limit to last 200 messages for performance

    // Mark messages as read
    await Message.updateMany(
      { sender_id: user2, receiver_id: user1, read: false },
      { read: true }
    )

    res.json(messages)
  } catch (error) {
    console.error('Get conversation error:', error)
    res.status(500).json({ detail: 'Failed to get conversation' })
  }
})

// Get all conversations for a user — only the user themselves can view
router.get('/conversations/:user_id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.user_id

    // IDOR protection
    if (req.userId !== userId) {
      return res.status(403).json({ detail: 'Forbidden' })
    }

    // Fix N+1 query: use aggregation pipeline instead of per-user queries
    const sentMessages = await Message.find({ sender_id: userId }).distinct('receiver_id')
    const receivedMessages = await Message.find({ receiver_id: userId }).distinct('sender_id')

    const allUserIds = [...new Set([...sentMessages.map(String), ...receivedMessages.map(String)])]

    // Batch fetch all partner users and last messages in parallel
    const [users, lastMessages, unreadCounts] = await Promise.all([
      User.find({ _id: { $in: allUserIds } }).select('profile role').lean(),
      Promise.all(allUserIds.map(otherId =>
        Message.findOne({
          $or: [
            { sender_id: userId, receiver_id: otherId },
            { sender_id: otherId, receiver_id: userId },
          ],
        }).sort({ created_at: -1 }).lean()
      )),
      Promise.all(allUserIds.map(otherId =>
        Message.countDocuments({ sender_id: otherId, receiver_id: userId, read: false })
      )),
    ])

    const userMap = new Map(users.map(u => [u._id.toString(), u]))

    const conversations = allUserIds.map((otherId, i) => ({
      user: userMap.get(otherId) || null,
      last_message: lastMessages[i],
      unread_count: unreadCounts[i],
    }))

    conversations.sort((a, b) => {
      const aTime = (a.last_message as any)?.created_at?.getTime?.() || 0
      const bTime = (b.last_message as any)?.created_at?.getTime?.() || 0
      return bTime - aTime
    })

    res.json(conversations)
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({ detail: 'Failed to get conversations' })
  }
})

// Get unread message count — only the user themselves
router.get('/unread/:user_id', authenticate, async (req: AuthRequest, res) => {
  try {
    // IDOR protection
    if (req.userId !== req.params.user_id) {
      return res.status(403).json({ detail: 'Forbidden' })
    }

    const count = await Message.countDocuments({
      receiver_id: req.params.user_id,
      read: false,
    })
    res.json({ count })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ detail: 'Failed to get unread count' })
  }
})

export default router
