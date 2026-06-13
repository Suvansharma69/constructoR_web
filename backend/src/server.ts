import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import mongoSanitize from 'mongo-sanitize'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from './config/db.js'
import { verifyToken } from './utils/jwt.js'

// Routes
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import professionalsRoutes from './routes/professionals.js'
import projectsRoutes from './routes/projects.js'
import materialsRoutes from './routes/materials.js'
import ordersRoutes from './routes/orders.js'
import messagesRoutes from './routes/messages.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const httpServer = createServer(app)

// ─── Allowed Origins ─────────────────────────────────────────────────────────
const allowedOrigins: string[] = [
  'http://localhost:3000',
  'http://localhost:5173',
]
if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach(o => allowedOrigins.push(o.trim()))
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

// ─── Security: Helmet (HTTP headers) ─────────────────────────────────────────
// Adds: X-Frame-Options, X-Content-Type-Options, HSTS, X-XSS-Protection, etc.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow image serving
  contentSecurityPolicy: false, // handled by Cloudflare
}))

// ─── Rate Limiters ────────────────────────────────────────────────────────────
// Auth endpoints: 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { detail: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// OTP endpoint: 5 requests per 10 minutes (prevent SMS spam)
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { detail: 'Too many OTP requests. Please wait 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// General API: 200 requests per minute per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { detail: 'Rate limit exceeded. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Limit payload size on socket messages
  maxHttpBufferSize: 1e5, // 100KB max socket message
})

const PORT = process.env.PORT || 8000

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// Body size limits — prevent DoS via huge payloads
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ─── NoSQL Injection Prevention ───────────────────────────────────────────────
// Strips MongoDB operators ($, .) from request body/query to prevent injection
app.use((req, _res, next) => {
  req.body = mongoSanitize(req.body)
  req.query = mongoSanitize(req.query) as any
  req.params = mongoSanitize(req.params)
  next()
})

// ─── Static files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BuildEase API is running' })
})

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/auth/send-otp', otpLimiter) // extra limiter on OTP specifically
app.use('/api/profile', generalLimiter, profileRoutes)
app.use('/api/professionals', generalLimiter, professionalsRoutes)
app.use('/api/projects', generalLimiter, projectsRoutes)
app.use('/api/materials', generalLimiter, materialsRoutes)
app.use('/api/orders', generalLimiter, ordersRoutes)
app.use('/api/messages', generalLimiter, messagesRoutes)

// ─── Socket.IO Auth + Events ──────────────────────────────────────────────────
const connectedUsers = new Map<string, string>()

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined
  if (!token) return next(new Error('Authentication required'))
  const decoded = verifyToken(token)
  if (!decoded) return next(new Error('Invalid token'))
  ;(socket as any).userId = decoded.userId
  next()
})

io.on('connection', (socket) => {
  const userId = (socket as any).userId as string
  connectedUsers.set(userId, socket.id)

  socket.on('receive_message', (data: { receiver_id: string; message: any }) => {
    // Validate receiver_id is a string, not an object (NoSQL injection via socket)
    if (typeof data.receiver_id !== 'string') return
    const receiverSocketId = connectedUsers.get(data.receiver_id)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', data.message)
    }
  })

  socket.on('disconnect', () => {
    connectedUsers.delete(userId)
  })
})

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ detail: 'Route not found' })
})

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Never leak internal error details in production
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const isProd = process.env.NODE_ENV === 'production'
  console.error('Error:', err)

  if (err.message?.startsWith('CORS blocked')) {
    return res.status(403).json({ detail: 'CORS: origin not allowed' })
  }

  res.status(err.status || 500).json({
    detail: isProd ? 'Internal server error' : (err.message || 'Internal server error'),
  })
})

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB()
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`🔒 Security: Helmet, Rate limiting, NoSQL sanitization enabled`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
