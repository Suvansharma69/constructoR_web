import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from './config/db.js'

// Routes
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import professionalsRoutes from './routes/professionals.js'
import projectsRoutes from './routes/projects.js'
import materialsRoutes from './routes/materials.js'
import ordersRoutes from './routes/orders.js'
import messagesRoutes from './routes/messages.js'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const httpServer = createServer(app)

// Build list of allowed origins from env
const allowedOrigins: string[] = [
  'http://localhost:3000',
  'http://localhost:5173',
]
if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach(o => allowedOrigins.push(o.trim()))
}

const corsOptions = {
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Render health checks)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

const PORT = process.env.PORT || 8000

// Middleware
app.use(cors(corsOptions))
app.options('*', cors(corsOptions)) // pre-flight
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BuildEase API is running' })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/professionals', professionalsRoutes)
app.use('/api/projects', projectsRoutes)
app.use('/api/materials', materialsRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/messages', messagesRoutes)

// Socket.io connection handling
const connectedUsers = new Map<string, string>() // userId -> socketId

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id)

  // User joins with their ID
  socket.on('join', (userId: string) => {
    connectedUsers.set(userId, socket.id)
    console.log(`✅ User ${userId} joined with socket ${socket.id}`)
  })

  // Handle new message
  socket.on('new_message', (data: { sender_id: string; receiver_id: string; message: any }) => {
    const receiverSocketId = connectedUsers.get(data.receiver_id)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', data.message)
      console.log(`📨 Message sent to user ${data.receiver_id}`)
    }
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    // Remove user from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId)
        console.log(`👋 User ${userId} disconnected`)
        break
      }
    }
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ detail: 'Route not found' })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({ detail: err.message || 'Internal server error' })
})

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB()
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`📡 Socket.io ready for real-time connections`)
      console.log(`📁 Static files served from /uploads`)
      console.log(`🔗 API endpoints available at /api/*`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
