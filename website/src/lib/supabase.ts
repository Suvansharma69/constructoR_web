import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Types
export interface User {
  id: string
  firebase_uid?: string
  contact: string
  contact_type: 'phone' | 'email'
  role: 'homeowner' | 'architect' | 'contractor' | 'interior_designer' | 'vendor'
  profile_completed: boolean
  email_verified: boolean
  name?: string
  city?: string
  avatar?: string
  experience?: number
  specializations?: string[]
  price_range?: string
  consultation_fee?: number
  portfolio_images?: string[]
  shop_name?: string
  owner_name?: string
  address?: string
  gst_number?: string
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  project_type: string
  title: string
  description: string
  location: string
  budget: number
  timeline: string
  status: 'pending' | 'in_progress' | 'completed'
  images?: string[]
  documents?: string[]
  created_at: string
}

export interface Material {
  id: string
  vendor_id: string
  name: string
  category: string
  brand?: string
  price: number
  unit: string
  description?: string
  stock: number
  in_stock: boolean
  images: string[]
  vendor_name?: string
  city?: string
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  items: {
    material_id: string
    quantity: number
    price: number
  }[]
  delivery_address: string
  total_amount: number
  status: 'pending' | 'processing' | 'delivered' | 'cancelled'
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  read: boolean
  created_at: string
}

export interface Bid {
  id: string
  project_id: string
  professional_id: string
  proposal: string
  estimated_cost: number
  estimated_days: number
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export interface Conversation {
  partner_id: string
  partner_name: string
  partner_role: string
  last_message?: Message
  unread_count: number
}
