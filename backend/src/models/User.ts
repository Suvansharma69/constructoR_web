import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  _id: string
  contact: string
  contact_type: 'phone' | 'email'
  role: 'homeowner' | 'architect' | 'contractor' | 'interior_designer' | 'vendor'
  profile_completed: boolean
  profile?: {
    name?: string
    city?: string
    avatar?: string
    // Professionals
    experience?: number
    specializations?: string[]
    price_range?: string
    consultation_fee?: number
    portfolio_images?: string[]
    // Vendor
    shop_name?: string
    owner_name?: string
    address?: string
    gst_number?: string
  }
  created_at: Date
}

const UserSchema = new Schema<IUser>({
  contact: { type: String, required: true, unique: true },
  contact_type: { type: String, enum: ['phone', 'email'], required: true },
  role: { type: String, enum: ['homeowner', 'architect', 'contractor', 'interior_designer', 'vendor'], required: true },
  profile_completed: { type: Boolean, default: false },
  profile: {
    name: String,
    city: String,
    avatar: String,
    experience: Number,
    specializations: [String],
    price_range: String,
    consultation_fee: Number,
    portfolio_images: [String],
    shop_name: String,
    owner_name: String,
    address: String,
    gst_number: String,
  },
  created_at: { type: Date, default: Date.now },
})

// Index for fast lookups
UserSchema.index({ role: 1, 'profile.city': 1 })

export default mongoose.model<IUser>('User', UserSchema)
