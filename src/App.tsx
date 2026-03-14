import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/auth'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'

import Login from './pages/Login'
import ProfileSetup from './pages/ProfileSetup'

// Homeowner
import Build from './pages/homeowner/Build'
import Architects from './pages/homeowner/Architects'
import Contractors from './pages/homeowner/Contractors'
import Designers from './pages/homeowner/Designers'
import Materials from './pages/homeowner/Materials'
import HomeownerProjects from './pages/homeowner/Projects'
import HomeownerOrders from './pages/homeowner/Orders'

// Professional
import ProfessionalDashboard from './pages/professional/Dashboard'
import ProfessionalProjects from './pages/professional/Projects'
import ProfessionalProfile from './pages/professional/Profile'

// Vendor
import VendorDashboard from './pages/vendor/Dashboard'
import VendorMaterials from './pages/vendor/Materials'
import VendorOrders from './pages/vendor/Orders'
import VendorProfile from './pages/vendor/Profile'

// Chat
import Chat from './pages/Chat'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, user } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (user && !user.profile_completed) return <Navigate to="/profile-setup" replace />
  return <Layout>{children}</Layout>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, user } = useAuth()
  if (!isLoggedIn) return <>{children}</>
  return <Navigate to={getDashboard(user?.role || '')} replace />
}

function getDashboard(role: string) {
  if (role === 'homeowner') return '/homeowner/build'
  if (role === 'vendor') return '/vendor/dashboard'
  return '/professional/dashboard'
}

function AppRoutes() {
  const { isLoggedIn, user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={
        <PublicOnlyRoute><Login /></PublicOnlyRoute>
      } />
      <Route path="/profile-setup" element={
        isLoggedIn ? <ProfileSetup /> : <Navigate to="/login" replace />
      } />

      {/* Homeowner */}
      <Route path="/homeowner/build" element={<PrivateRoute><Build /></PrivateRoute>} />
      <Route path="/homeowner/architects" element={<PrivateRoute><Architects /></PrivateRoute>} />
      <Route path="/homeowner/contractors" element={<PrivateRoute><Contractors /></PrivateRoute>} />
      <Route path="/homeowner/designers" element={<PrivateRoute><Designers /></PrivateRoute>} />
      <Route path="/homeowner/materials" element={<PrivateRoute><Materials /></PrivateRoute>} />
      <Route path="/homeowner/projects" element={<PrivateRoute><HomeownerProjects /></PrivateRoute>} />
      <Route path="/homeowner/orders" element={<PrivateRoute><HomeownerOrders /></PrivateRoute>} />

      {/* Professional */}
      <Route path="/professional/dashboard" element={<PrivateRoute><ProfessionalDashboard /></PrivateRoute>} />
      <Route path="/professional/projects" element={<PrivateRoute><ProfessionalProjects /></PrivateRoute>} />
      <Route path="/professional/profile" element={<PrivateRoute><ProfessionalProfile /></PrivateRoute>} />

      {/* Vendor */}
      <Route path="/vendor/dashboard" element={<PrivateRoute><VendorDashboard /></PrivateRoute>} />
      <Route path="/vendor/materials" element={<PrivateRoute><VendorMaterials /></PrivateRoute>} />
      <Route path="/vendor/orders" element={<PrivateRoute><VendorOrders /></PrivateRoute>} />
      <Route path="/vendor/profile" element={<PrivateRoute><VendorProfile /></PrivateRoute>} />

      {/* Chat */}
      <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
      <Route path="/chat/:userId" element={<PrivateRoute><Chat /></PrivateRoute>} />

      {/* Catch-all */}
      <Route path="/" element={
        isLoggedIn
          ? <Navigate to={getDashboard(user?.role || '')} replace />
          : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  )
}
