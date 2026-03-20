import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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
}

interface AuthCtx {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  updateUser: (user: User) => void
  logout: () => void
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

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

  const updateUser = (u: User) => {
    setUser(u)
    localStorage.setItem('be_user', JSON.stringify(u))
  }

  const logout = () => {
    setUser(null); setToken(null)
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
