import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'

export interface UserProfile {
  name?: string
  city?: string
  shop_name?: string
  owner_name?: string
  experience?: number
  specializations?: string[]
  price_range?: string
  consultation_fee?: number
  avatar?: string
}

export interface User {
  _id: string
  contact: string
  contact_type: string
  role: string
  profile_completed: boolean
  profile?: UserProfile
}

interface AuthCtx {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  updateUser: (user: User) => void
  logout: () => void
  isLoggedIn: boolean
}

// ── JWT expiry parser ─────────────────────────────────────────────────────────
function getJwtExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof decoded.exp === 'number' ? decoded.exp : null
  } catch { return null }
}

function isTokenExpired(token: string): boolean {
  const exp = getJwtExpiry(token)
  if (!exp) return true
  return Date.now() / 1000 > exp
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx)

// ── Idle timeout: 30 minutes of inactivity → auto-logout ──────────────────────
const IDLE_TIMEOUT_MS = 30 * 60 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Restore session on mount ────────────────────────────────────────────────
  useEffect(() => {
    const storedUser  = localStorage.getItem('be_user')
    const storedToken = localStorage.getItem('be_token')
    if (storedUser && storedToken) {
      if (isTokenExpired(storedToken)) {
        localStorage.removeItem('be_user')
        localStorage.removeItem('be_token')
        return
      }
      setUser(JSON.parse(storedUser))
      setToken(storedToken)
    }
  }, [])

  // ── Idle detection ──────────────────────────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      // Only auto-logout if user is actually logged in
      setUser(prev => {
        if (prev) {
          localStorage.removeItem('be_user')
          localStorage.removeItem('be_token')
          window.location.href = '/login'
        }
        return null
      })
      setToken(null)
    }, IDLE_TIMEOUT_MS)
  }, [])

  useEffect(() => {
    if (!user) return // only track idle when logged in
    const events = ['mousedown','mousemove','keydown','scroll','touchstart','click']
    events.forEach(e => window.addEventListener(e, resetIdleTimer, { passive: true }))
    resetIdleTimer() // start on login
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdleTimer))
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [user, resetIdleTimer])

  // ── Auth actions ────────────────────────────────────────────────────────────
  const login = (u: User, t: string) => {
    setUser(u)
    setToken(t)
    localStorage.setItem('be_user', JSON.stringify(u))
    localStorage.setItem('be_token', t)
  }

  const updateUser = (u: User) => {
    setUser(u)
    localStorage.setItem('be_user', JSON.stringify(u))
  }

  const logout = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    setUser(null)
    setToken(null)
    localStorage.removeItem('be_user')
    localStorage.removeItem('be_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, updateUser, logout, isLoggedIn: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
