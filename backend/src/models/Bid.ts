import mongoose, { Schema, Document } from 'mongoose'

export interface IBid extends Document {
  _id: string
  project_id: mongoose.Types.ObjectId
  professional_id: mongoose.Types.ObjectId
  proposal: string
  estimated_cost: number
  estimated_days: number
  status: 'pending' | 'accepted' | 'rejected'
  created_at: Date
}

const BidSchema = new Schema<IBid>({
  project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  professional_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  proposal: { type: String, required: true },
  estimated_cost: { type: Number, required: true },
  estimated_days: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
})

BidSchema.index({ project_id: 1 })
BidSchema.index({ professional_id: 1 })

export default mongoose.model<IBid>('Bid', BidSchema)
