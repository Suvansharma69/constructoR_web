import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { auth, onAuthStateChanged, signOut, type FirebaseUser } from '../lib/firebase'

export interface UserProfile {
  name?: string
  city?: string
  shop_name?: string
  experience?: number
  specializations?: string[]
  price_range?: string
  consultation_fee?: number
}

export interface User {
  _id: string
  contact: string
  contact_type: string
  role: string
  profile_completed: boolean
  profile?: UserProfile
  email_verified?: boolean
}

interface AuthCtx {
  user: User | null
  token: string | null
  firebaseUser: FirebaseUser | null
  login: (user: User, token: string) => void
  updateUser: (user: User) => void
  logout: () => void
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [initializing, setInitializing] = useState(true)

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser)
      if (!fbUser) {
        // Firebase signed out — clear app state too
        setUser(null)
        setToken(null)
        localStorage.removeItem('be_user')
        localStorage.removeItem('be_token')
      }
      setInitializing(false)
    })
    return unsub
  }, [])

  // Restore app state from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('be_user')
    const storedToken = localStorage.getItem('be_token')
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setToken(storedToken)
    }
  }, [])

  const login = (u: User, t: string) => {
    setUser(u); setToken(t)
    localStorage.setItem('be_user', JSON.stringify(u))
    localStorage.setItem('be_token', t)
  }

  const updateUser = (updatedData: Partial<User>) => {
    // Merge with existing user — profile update API doesn't return all fields (e.g. email_verified)
    // Without merge, those fields get wiped from localStorage on every profile save
    setUser(prev => {
      const merged = prev ? { ...prev, ...updatedData, profile: { ...(prev.profile || {}), ...(updatedData.profile || {}) } } : updatedData as User
      localStorage.setItem('be_user', JSON.stringify(merged))
      return merged
    })
  }

  const logout = async () => {
    try {
      await signOut(auth) // Firebase sign out
    } catch (_) { /* ignore */ }
    setUser(null); setToken(null); setFirebaseUser(null)
    localStorage.removeItem('be_user')
    localStorage.removeItem('be_token')
  }

  // Show nothing while Firebase initializes (prevents flash)
  if (initializing) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#0F172A',
      }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, token, firebaseUser, login, updateUser, logout, isLoggedIn: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
