import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/auth'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'

// Lazy-load all pages — reduces initial bundle from 566KB to ~80KB
const Login = lazy(() => import('./pages/Login'))
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'))

// Homeowner
const Build = lazy(() => import('./pages/homeowner/Build'))
const Architects = lazy(() => import('./pages/homeowner/Architects'))
const Contractors = lazy(() => import('./pages/homeowner/Contractors'))
const Designers = lazy(() => import('./pages/homeowner/Designers'))
const Materials = lazy(() => import('./pages/homeowner/Materials'))
const HomeownerProjects = lazy(() => import('./pages/homeowner/Projects'))
const HomeownerOrders = lazy(() => import('./pages/homeowner/Orders'))

// Professional
const ProfessionalDashboard = lazy(() => import('./pages/professional/Dashboard'))
const ProfessionalProjects = lazy(() => import('./pages/professional/Projects'))
const ProfessionalProfile = lazy(() => import('./pages/professional/Profile'))

// Vendor
const VendorDashboard = lazy(() => import('./pages/vendor/Dashboard'))
const VendorMaterials = lazy(() => import('./pages/vendor/Materials'))
const VendorOrders = lazy(() => import('./pages/vendor/Orders'))
const VendorProfile = lazy(() => import('./pages/vendor/Profile'))

// Chat
const Chat = lazy(() => import('./pages/Chat'))

// Page-level loading fallback
function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  )
}

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
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
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
