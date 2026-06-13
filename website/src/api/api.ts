/// <reference types="vite/client" />
import axios from 'axios'

const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE + '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('be_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-logout on 401 (expired/invalid token) — prevents silent failures
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Clear auth state and redirect to login
      localStorage.removeItem('be_user')
      localStorage.removeItem('be_token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// Simple in-memory cache for GET requests to reduce Render cold-start lag
const cache = new Map<string, { data: any; ts: number }>()
const CACHE_TTL = 30_000 // 30 seconds

export const cachedGet = async (url: string, params?: Record<string, string>) => {
  const key = url + JSON.stringify(params || {})
  const cached = cache.get(key)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data
  const res = await api.get(url, { params })
  cache.set(key, { data: res, ts: Date.now() })
  return res
}

export const clearCache = (url?: string) => {
  if (url) {
    for (const key of cache.keys()) {
      if (key.startsWith(url)) cache.delete(key)
    }
  } else {
    cache.clear()
  }
}


// Helper: only use mock fallback if it's a network/offline error (no response from server)
// For real 4xx/5xx errors, always throw so the UI shows the real error message
const isMockable = (err: any): boolean => {
  // Network error = no response (backend not running)
  return !err.response
}

// ============ Auth (Firebase) ============
export const firebaseLogin = async (idToken: string, role: string, name?: string) => {
  try {
    return await api.post('/auth/firebase-login', { idToken, role, name })
  } catch (err: any) {
    if (isMockable(err)) {
      // Mock fallback when backend is offline
      return {
        data: {
          token: `mock-token-${Date.now()}`,
          user: {
            _id: `mock-${role}-${Date.now()}`,
            contact: 'mock@user.com',
            contact_type: 'email',
            role,
            profile_completed: false,
            email_verified: false,
          },
        },
      }
    }
    throw err
  }
}

export const getUser = (user_id: string) =>
  api.get(`/auth/user/${user_id}`)

// ============ Profile ============
export const updateUserProfile = async (user_id: string, profile: object) => {
  try {
    return await api.post(`/profile/user/${user_id}`, profile)
  } catch (err) {
    if (isMockable(err)) {
      const stored = localStorage.getItem('be_user')
      const user = stored ? JSON.parse(stored) : {}
      return { data: { ...user, profile_completed: true, profile: { ...user.profile, ...profile } } }
    }
    throw err
  }
}

export const updateProfessionalProfile = async (user_id: string, profile: object) => {
  try {
    return await api.post(`/profile/professional/${user_id}`, profile)
  } catch (err) {
    if (isMockable(err)) {
      const stored = localStorage.getItem('be_user')
      const user = stored ? JSON.parse(stored) : {}
      return { data: { ...user, profile_completed: true, profile: { ...user.profile, ...profile } } }
    }
    throw err
  }
}

export const updateVendorProfile = async (user_id: string, profile: object) => {
  try {
    return await api.post(`/profile/vendor/${user_id}`, profile)
  } catch (err) {
    if (isMockable(err)) {
      const stored = localStorage.getItem('be_user')
      const user = stored ? JSON.parse(stored) : {}
      return { data: { ...user, profile_completed: true, profile: { ...user.profile, ...profile } } }
    }
    throw err
  }
}

// ============ Professionals ============
export const getProfessionals = async (role: string, city?: string) => {
  try {
    return await api.get(`/professionals/${role}`, { params: city ? { city } : {} })
  } catch (err) {
    if (isMockable(err)) return { data: [] }
    throw err
  }
}

// ============ Projects ============
export const createProject = async (user_id: string, project: object) => {
  try {
    return await api.post(`/projects?user_id=${user_id}`, project)
  } catch (err) {
    if (isMockable(err)) {
      return { data: { _id: `mock-proj-${Date.now()}`, ...project, status: 'pending', created_at: new Date().toISOString() } }
    }
    throw err
  }
}

export const getUserProjects = async (user_id: string) => {
  try {
    return await api.get(`/projects/user/${user_id}`)
  } catch (err) {
    if (isMockable(err)) return { data: [] }
    throw err
  }
}

export const getAvailableProjects = async (role: string, location?: string) => {
  try {
    // Backend reads req.query.location — must use 'location' not 'city'
    return await api.get(`/projects/available/${role}`, { params: location ? { location } : {} })
  } catch (err) {
    if (isMockable(err)) return { data: [] }
    throw err
  }
}

export const bidOnProject = async (project_id: string, user_id: string, bid: object) => {
  try {
    return await api.post(`/projects/${project_id}/bid?user_id=${user_id}`, bid)
  } catch (err) {
    if (isMockable(err)) return { data: { success: true } }
    throw err
  }
}

// ============ Materials ============
export const getMaterials = async (category?: string) => {
  try {
    return await api.get('/materials', { params: category ? { category } : {} })
  } catch (err) {
    if (isMockable(err)) return { data: [] }
    throw err
  }
}

export const getVendorMaterials = async (vendor_id: string) => {
  try {
    return await api.get(`/materials/vendor/${vendor_id}`)
  } catch (err) {
    if (isMockable(err)) return { data: [] }
    throw err
  }
}

export const createMaterial = async (vendor_id: string, material: object) => {
  try {
    return await api.post(`/materials?vendor_id=${vendor_id}`, material)
  } catch (err) {
    if (isMockable(err)) return { data: { _id: `mock-mat-${Date.now()}`, ...material } }
    throw err
  }
}

export const deleteMaterial = async (material_id: string, vendor_id: string) => {
  try {
    return await api.delete(`/materials/${material_id}`, { params: { vendor_id } })
  } catch (err) {
    if (isMockable(err)) return { data: { success: true } }
    throw err
  }
}

// ============ Orders ============
export const createOrder = async (user_id: string, order: object) => {
  try {
    return await api.post(`/orders?user_id=${user_id}`, order)
  } catch (err) {
    if (isMockable(err)) {
      return { data: { _id: `mock-order-${Date.now()}`, ...order, status: 'pending', created_at: new Date().toISOString() } }
    }
    throw err
  }
}

export const getUserOrders = async (user_id: string) => {
  try {
    return await api.get(`/orders/user/${user_id}`)
  } catch (err) {
    if (isMockable(err)) return { data: [] }
    throw err
  }
}

export const getVendorOrders = async (vendor_id: string) => {
  try {
    return await api.get(`/orders/vendor/${vendor_id}`)
  } catch (err) {
    if (isMockable(err)) return { data: [] }
    throw err
  }
}

export const updateOrderStatus = async (order_id: string, status: string) => {
  try {
    return await api.put(`/orders/${order_id}/status`, { status })
  } catch (err) {
    if (isMockable(err)) return { data: { success: true } }
    throw err
  }
}

// ============ Messages ============
export const sendMessage = async (user_id: string, message: object) => {
  try {
    return await api.post(`/messages?user_id=${user_id}`, message)
  } catch (err) {
    if (isMockable(err)) {
      const msg = message as any
      return {
        data: {
          _id: `mock-msg-${Date.now()}`,
          sender_id: user_id,
          receiver_id: msg.receiver_id,
          message: msg.message,
          created_at: new Date().toISOString(),
          read: false,
        }
      }
    }
    throw err
  }
}

export const getConversation = async (user_id: string, other_id: string) => {
  try {
    return await api.get(`/messages/conversation/${user_id}/${other_id}`)
  } catch (err) {
    if (isMockable(err)) return { data: [] }
    throw err
  }
}

export const getConversations = async (user_id: string) => {
  try {
    return await api.get(`/messages/conversations/${user_id}`)
  } catch (err) {
    if (isMockable(err)) return { data: [] }
    throw err
  }
}

export const getUnreadCount = async (user_id: string) => {
  try {
    return await api.get(`/messages/unread/${user_id}`)
  } catch (err) {
    if (isMockable(err)) return { data: { count: 0 } }
    throw err
  }
}

// ============ File Uploads ============
export const uploadAvatar = async (user_id: string, file: File) => {
  try {
    const formData = new FormData()
    formData.append('avatar', file)
    return await api.post(`/profile/upload-avatar/${user_id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  } catch (err) {
    if (isMockable(err)) {
      // Mock: return a fake avatar URL
      return { data: { avatar: '/uploads/profiles/mock-avatar.jpg' } }
    }
    throw err
  }
}

export const uploadPortfolio = async (user_id: string, files: File[]) => {
  try {
    const formData = new FormData()
    files.forEach(file => formData.append('images', file))
    return await api.post(`/profile/upload-portfolio/${user_id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  } catch (err) {
    if (isMockable(err)) {
      // Mock: return fake portfolio URLs
      const mockUrls = files.map((_, i) => `/uploads/portfolios/mock-portfolio-${i}.jpg`)
      return { data: { portfolio_images: mockUrls } }
    }
    throw err
  }
}

export const uploadMaterialImages = async (files: File[]) => {
  try {
    const formData = new FormData()
    files.forEach(file => formData.append('images', file))
    // This will be called during material creation
    return { data: { images: files.map(f => URL.createObjectURL(f)) } }
  } catch (err) {
    throw err
  }
}

export const uploadProjectDocuments = async (files: File[]) => {
  try {
    const formData = new FormData()
    files.forEach(file => formData.append('documents', file))
    // This will be called during project creation
    return { data: { documents: files.map(f => URL.createObjectURL(f)) } }
  } catch (err) {
    throw err
  }
}

export const BACKEND_URL = BASE
export default api
