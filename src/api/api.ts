/// <reference types="vite/client" />
import axios from 'axios'

const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

// Unique request ID generator
const genRid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)

const api = axios.create({
  baseURL: BASE + '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach JWT + request ID ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('be_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Request-ID'] = genRid()
  return config
})

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale auth state and bounce to login
      localStorage.removeItem('be_user')
      localStorage.removeItem('be_token')
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const sendOTP        = (contact: string, contact_type: string) =>
  api.post('/auth/send-otp', { contact, contact_type })
export const verifyOTP      = (contact: string, otp: string, role: string) =>
  api.post('/auth/verify-otp', { contact, otp, role })
export const firebaseLogin  = (idToken: string, role: string, name?: string) =>
  api.post('/auth/firebase-login', { idToken, role, name })
export const getUser        = (user_id: string) => api.get(`/auth/user/${user_id}`)
export const logoutAPI      = () => api.post('/auth/logout')

// ── Profile ───────────────────────────────────────────────────────────────────
export const updateUserProfile         = (user_id: string, profile: object) =>
  api.post(`/profile/user/${user_id}`, profile)
export const updateProfessionalProfile = (user_id: string, profile: object) =>
  api.post(`/profile/professional/${user_id}`, profile)
export const updateVendorProfile       = (user_id: string, profile: object) =>
  api.post(`/profile/vendor/${user_id}`, profile)

// ── Professionals ─────────────────────────────────────────────────────────────
export const getProfessionals = (role: string, city?: string) =>
  api.get(`/professionals/${role}`, { params: city ? { city } : {} })

// ── Projects ──────────────────────────────────────────────────────────────────
export const createProject       = (_user_id: string, project: object) =>
  api.post('/projects', project)
export const getUserProjects     = (user_id: string) =>
  api.get(`/projects/user/${user_id}`)
export const getAvailableProjects = (role: string, city?: string) =>
  api.get(`/projects/available/${role}`, { params: city ? { city } : {} })
export const bidOnProject        = (project_id: string, _user_id: string, bid: object) =>
  api.post(`/projects/${project_id}/bid`, bid)

// ── Materials ─────────────────────────────────────────────────────────────────
export const getMaterials      = (category?: string) =>
  api.get('/materials', { params: category ? { category } : {} })
export const getVendorMaterials = (vendor_id: string) =>
  api.get(`/materials/vendor/${vendor_id}`)
export const createMaterial    = (_vendor_id: string, material: object) =>
  api.post('/materials', material)
export const updateMaterial    = (material_id: string, updates: object) =>
  api.put(`/materials/${material_id}`, updates)
export const deleteMaterial    = (material_id: string, _vendor_id: string) =>
  api.delete(`/materials/${material_id}`)

// ── Orders ────────────────────────────────────────────────────────────────────
export const createOrder       = (_user_id: string, order: object) =>
  api.post('/orders', order)
export const getUserOrders     = (user_id: string) =>
  api.get(`/orders/user/${user_id}`)
export const getVendorOrders   = (vendor_id: string) =>
  api.get(`/orders/vendor/${vendor_id}`)
export const updateOrderStatus = (order_id: string, status: string) =>
  api.put(`/orders/${order_id}/status`, { status })

// ── Messages ──────────────────────────────────────────────────────────────────
export const sendMessage     = (_user_id: string, message: object) =>
  api.post('/messages', message)
export const getConversation = (user_id: string, other_id: string) =>
  api.get(`/messages/conversation/${user_id}/${other_id}`)
export const getConversations = (user_id: string) =>
  api.get(`/messages/conversations/${user_id}`)
export const getUnreadCount  = (user_id: string) =>
  api.get(`/messages/unread/${user_id}`)

export const BACKEND_URL = BASE
export default api
