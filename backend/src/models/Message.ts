import mongoose, { Schema, Types, Document } from 'mongoose'

export interface IMessage extends Document {
  _id: Types.ObjectId
  sender_id: mongoose.Types.ObjectId
  receiver_id: mongoose.Types.ObjectId
  message: string
  read: boolean
  created_at: Date
}

const MessageSchema = new Schema<IMessage>({
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
})

MessageSchema.index({ sender_id: 1, receiver_id: 1 })
MessageSchema.index({ receiver_id: 1, read: 1 })

export default mongoose.model<IMessage>('Message', MessageSchema)
