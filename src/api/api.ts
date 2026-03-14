import axios from 'axios'

const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE + '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Auth
const MOCK_OTP = '123456'

export const sendOTP = async (contact: string, contact_type: string) => {
  try {
    return await api.post('/auth/send-otp', { contact, contact_type })
  } catch {
    return {
      data: {
        mock_otp: MOCK_OTP,
        mocked: true,
      },
    }
  }
}

export const verifyOTP = async (contact: string, otp: string, role: string) => {
  try {
    return await api.post('/auth/verify-otp', { contact, otp, role })
  } catch {
    if (otp !== MOCK_OTP) {
      throw { response: { data: { detail: `Invalid OTP. Use ${MOCK_OTP} in mock mode` } } }
    }

    const isEmail = contact.includes('@')
    return {
      data: {
        token: `mock-token-${Date.now()}`,
        user: {
          _id: `mock-${role}-${Date.now()}`,
          contact,
          contact_type: isEmail ? 'email' : 'phone',
          role,
          profile_completed: false,
        },
        mocked: true,
      },
    }
  }
}

export const getUser = (user_id: string) =>
  api.get(`/auth/user/${user_id}`)

// Profile
export const updateUserProfile = (user_id: string, profile: object) =>
  api.post(`/profile/user/${user_id}`, profile)

export const updateProfessionalProfile = (user_id: string, profile: object) =>
  api.post(`/profile/professional/${user_id}`, profile)

export const updateVendorProfile = (user_id: string, profile: object) =>
  api.post(`/profile/vendor/${user_id}`, profile)

// Professionals
export const getProfessionals = (role: string, city?: string) =>
  api.get(`/professionals/${role}`, { params: city ? { city } : {} })

// Projects
export const createProject = (user_id: string, project: object) =>
  api.post(`/projects?user_id=${user_id}`, project)

export const getUserProjects = (user_id: string) =>
  api.get(`/projects/user/${user_id}`)

export const getAvailableProjects = (role: string, city?: string) =>
  api.get(`/projects/available/${role}`, { params: city ? { city } : {} })

export const bidOnProject = (project_id: string, user_id: string, bid: object) =>
  api.post(`/projects/${project_id}/bid?user_id=${user_id}`, bid)

// Materials
export const getMaterials = (category?: string) =>
  api.get('/materials', { params: category ? { category } : {} })

export const getVendorMaterials = (vendor_id: string) =>
  api.get(`/materials/vendor/${vendor_id}`)

export const createMaterial = (vendor_id: string, material: object) =>
  api.post(`/materials?vendor_id=${vendor_id}`, material)

export const deleteMaterial = (material_id: string, vendor_id: string) =>
  api.delete(`/materials/${material_id}`, { params: { vendor_id } })

// Orders
export const createOrder = (user_id: string, order: object) =>
  api.post(`/orders?user_id=${user_id}`, order)

export const getUserOrders = (user_id: string) =>
  api.get(`/orders/user/${user_id}`)

export const getVendorOrders = (vendor_id: string) =>
  api.get(`/orders/vendor/${vendor_id}`)

export const updateOrderStatus = (order_id: string, status: string) =>
  api.put(`/orders/${order_id}/status`, { status })

// Messages
export const sendMessage = (user_id: string, message: object) =>
  api.post(`/messages?user_id=${user_id}`, message)

export const getConversation = (user_id: string, other_id: string) =>
  api.get(`/messages/conversation/${user_id}/${other_id}`)

export const getConversations = (user_id: string) =>
  api.get(`/messages/conversations/${user_id}`)

export const getUnreadCount = (user_id: string) =>
  api.get(`/messages/unread/${user_id}`)

export const BACKEND_URL = BASE
export default api
