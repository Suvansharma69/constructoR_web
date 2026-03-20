import mongoose, { Schema, Document } from 'mongoose'

export interface IMaterial extends Document {
  _id: string
  vendor_id: mongoose.Types.ObjectId
  name: string
  category: string
  brand?: string
  price: number
  unit: string
  description?: string
  stock: number
  in_stock: boolean
  images: string[]
  created_at: Date
}

const MaterialSchema = new Schema<IMaterial>({
  vendor_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  brand: String,
  price: { type: Number, required: true },
  unit: { type: String, required: true },
  description: String,
  stock: { type: Number, default: 0 },
  in_stock: { type: Boolean, default: true },
  images: [String],
  created_at: { type: Date, default: Date.now },
})

MaterialSchema.index({ vendor_id: 1 })
MaterialSchema.index({ category: 1 })

export default mongoose.model<IMaterial>('Material', MaterialSchema)
