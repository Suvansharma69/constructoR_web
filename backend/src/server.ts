import './env.js' // ← MUST be first: loads .env before any module reads process.env
import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import mongoSanitize from 'mongo-sanitize'
import rateLimit from 'express-rate-limit'
import hpp from 'hpp'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { connectDB } from './config/db.js'
import { connectRedis } from './config/redis.js'
import { verifyToken, blacklistToken } from './utils/jwt.js'

// Routes
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import professionalsRoutes from './routes/professionals.js'
import projectsRoutes from './routes/projects.js'
import materialsRoutes from './routes/materials.js'
import ordersRoutes from './routes/orders.js'
import messagesRoutes from './routes/messages.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const httpServer = createServer(app)
const connectedUsers = new Map<string, string>()

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}

// ─── Security: Helmet ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // handled by Cloudflare / meta tag
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}))

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { detail: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { detail: 'Too many OTP requests. Please wait 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

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
  maxHttpBufferSize: 1e5, // 100KB max socket message
})
app.locals.io = io
app.locals.connectedUsers = connectedUsers

const PORT = process.env.PORT || 8000

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// Body size limits
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ─── Request ID (audit trail) ─────────────────────────────────────────────────
app.use((req, res, next) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID()
  req.headers['x-request-id'] = requestId
  res.setHeader('X-Request-ID', requestId)
  next()
})

// ─── Structured Request Logging ───────────────────────────────────────────────
app.use((req, _res, next) => {
  const isProd = process.env.NODE_ENV === 'production'
  if (!isProd) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} — rid:${req.headers['x-request-id']}`)
  }
  next()
})

// ─── HTTP Parameter Pollution Prevention ──────────────────────────────────────
app.use(hpp())

// ─── NoSQL Injection Prevention ───────────────────────────────────────────────
app.use((req, _res, next) => {
  req.body   = mongoSanitize(req.body)
  req.query  = mongoSanitize(req.query) as any
  req.params = mongoSanitize(req.params)
  next()
})

// ─── Static files (dev only — prod uses Cloudinary CDN) ──────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    dotfiles: 'deny',
    etag: true,
    maxAge: '7d',
  }))
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'constructoR API is running', ts: Date.now() })
})

// ─── Logout endpoint (token blacklisting) ────────────────────────────────────
app.post('/api/auth/logout', async (req, res) => {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    await blacklistToken(token)
  }
  res.json({ message: 'Logged out successfully' })
})

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes)
// Note: otpLimiter is applied inline in the auth router for the /send-otp path
app.use('/api/profile', generalLimiter, profileRoutes)
app.use('/api/professionals', generalLimiter, professionalsRoutes)
app.use('/api/projects', generalLimiter, projectsRoutes)
app.use('/api/materials', generalLimiter, materialsRoutes)
app.use('/api/orders', generalLimiter, ordersRoutes)
app.use('/api/messages', generalLimiter, messagesRoutes)

// ─── Socket.IO Auth + Events ──────────────────────────────────────────────────
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined
  if (!token) return next(new Error('Authentication required'))
  const decoded = await verifyToken(token)
  if (!decoded) return next(new Error('Invalid token'))
  ;(socket as any).userId = decoded.userId
  next()
})

io.on('connection', (socket) => {
  const userId = (socket as any).userId as string
  connectedUsers.set(userId, socket.id)

  socket.on('receive_message', (data: { receiver_id: string; message: any }) => {
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
app.use((_req, res) => {
  res.status(404).json({ detail: 'Route not found' })
})

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const isProd = process.env.NODE_ENV === 'production'
  const rid = req.headers['x-request-id']
  console.error(`[ERROR] rid:${rid}`, err.message || err)

  if (err.message?.startsWith('CORS blocked')) {
    return res.status(403).json({ detail: 'CORS: origin not allowed' })
  }

  res.status(err.status || 500).json({
    detail: isProd ? 'Internal server error' : (err.message || 'Internal server error'),
    ...(isProd ? {} : { rid }),
  })
})

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB()
    await connectRedis()
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`🔒 Security: Helmet, HPP, Rate limiting, NoSQL sanitization, JWT blacklisting (Redis) enabled`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
