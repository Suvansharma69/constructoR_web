import mongoose, { Schema, Document } from 'mongoose'

export interface IOrder extends Document {
  _id: string
  user_id: mongoose.Types.ObjectId
  items: {
    material_id: mongoose.Types.ObjectId
    quantity: number
    price: number
  }[]
  delivery_address: string
  total_amount: number
  status: 'pending' | 'processing' | 'delivered' | 'cancelled'
  created_at: Date
}

const OrderSchema = new Schema<IOrder>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    material_id: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  delivery_address: { type: String, required: true },
  total_amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processing', 'delivered', 'cancelled'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
})

OrderSchema.index({ user_id: 1 })

export default mongoose.model<IOrder>('Order', OrderSchema)
