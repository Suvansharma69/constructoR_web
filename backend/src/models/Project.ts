import mongoose, { Schema, Types, Document } from 'mongoose'

export interface IProject extends Document {
  _id: Types.ObjectId
  user_id: mongoose.Types.ObjectId
  project_type: string   // 'build' | 'renovate'
  city: string
  budget_range?: string
  description?: string
  plot_size?: number
  floors?: number
  status: 'pending' | 'in_progress' | 'completed'
  images?: string[]
  documents?: string[]
  created_at: Date
}

const ProjectSchema = new Schema<IProject>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  project_type: { type: String, required: true },
  city: { type: String, required: true },
  budget_range: String,
  description: String,
  plot_size: Number,
  floors: Number,
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  images: [String],
  documents: [String],
  created_at: { type: Date, default: Date.now },
})

ProjectSchema.index({ user_id: 1 })
ProjectSchema.index({ city: 1, status: 1 })

export default mongoose.model<IProject>('Project', ProjectSchema)
