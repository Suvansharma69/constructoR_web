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

    const newMessage = new Message({
      sender_id: req.userId,
      receiver_id,
      message,
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

// Get conversation between two users
router.get('/conversation/:user1/:user2', authenticate, async (req: AuthRequest, res) => {
  try {
    const { user1, user2 } = req.params

    const messages = await Message.find({
      $or: [
        { sender_id: user1, receiver_id: user2 },
        { sender_id: user2, receiver_id: user1 },
      ],
    })
      .populate('sender_id', 'profile')
      .populate('receiver_id', 'profile')
      .sort({ created_at: 1 })

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

// Get all conversations for a user
router.get('/conversations/:user_id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.user_id

    // Find all unique users this user has messaged with
    const sentMessages = await Message.find({ sender_id: userId }).distinct('receiver_id')
    const receivedMessages = await Message.find({ receiver_id: userId }).distinct('sender_id')

    const allUserIds = [...new Set([...sentMessages, ...receivedMessages])]

    // Get user details and last message
    const conversations = await Promise.all(
      allUserIds.map(async (otherUserId) => {
        const user = await User.findById(otherUserId).select('profile role')
        const lastMessage = await Message.findOne({
          $or: [
            { sender_id: userId, receiver_id: otherUserId },
            { sender_id: otherUserId, receiver_id: userId },
          ],
        }).sort({ created_at: -1 })

        const unreadCount = await Message.countDocuments({
          sender_id: otherUserId,
          receiver_id: userId,
          read: false,
        })

        return {
          user,
          last_message: lastMessage,
          unread_count: unreadCount,
        }
      })
    )

    // Sort by last message time
    conversations.sort((a, b) => {
      const aTime = a.last_message?.created_at?.getTime() || 0
      const bTime = b.last_message?.created_at?.getTime() || 0
      return bTime - aTime
    })

    res.json(conversations)
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({ detail: 'Failed to get conversations' })
  }
})

// Get unread message count
router.get('/unread/:user_id', authenticate, async (req: AuthRequest, res) => {
  try {
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
