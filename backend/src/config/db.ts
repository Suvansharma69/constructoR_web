import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buildease'

    // ── Mongoose global settings ────────────────────────────────────────────────
    mongoose.set('strict', true)          // reject unknown fields
    mongoose.set('strictQuery', true)     // reject unknown query operators
    mongoose.set('sanitizeFilter', true)  // strip $ from query filters (extra NoSQL protection)

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,                    // connection pool
      serverSelectionTimeoutMS: 8000,     // fail fast if Atlas is unreachable
      socketTimeoutMS: 45000,             // idle socket timeout
      connectTimeoutMS: 10000,            // initial connection timeout
      retryWrites: true,
      w: 'majority',                      // write concern
    })

    console.log('✅ MongoDB connected successfully')

    // Log connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message)
    })
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected — attempting reconnect...')
    })
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected')
    })

  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}
