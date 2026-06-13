import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { getUnreadCount } from '../api/api'

interface NavItem { label: string; icon: string; to: string }

function getNavItems(role: string): NavItem[] {
  if (role === 'homeowner') return [
    { label: 'Build / Renovate',    icon: '◈', to: '/homeowner/build' },
    { label: 'Architects',          icon: '◈', to: '/homeowner/architects' },
    { label: 'Contractors',         icon: '◈', to: '/homeowner/contractors' },
    { label: 'Interior Designers',  icon: '◈', to: '/homeowner/designers' },
    { label: 'Materials',           icon: '◈', to: '/homeowner/materials' },
    { label: 'My Projects',         icon: '◈', to: '/homeowner/projects' },
    { label: 'My Orders',           icon: '◈', to: '/homeowner/orders' },
    { label: 'Messages',            icon: '◈', to: '/chat' },
  ]
  if (role === 'vendor') return [
    { label: 'Dashboard',   icon: '◈', to: '/vendor/dashboard' },
    { label: 'Products',    icon: '◈', to: '/vendor/materials' },
    { label: 'Orders',      icon: '◈', to: '/vendor/orders' },
    { label: 'Profile',     icon: '◈', to: '/vendor/profile' },
    { label: 'Messages',    icon: '◈', to: '/chat' },
  ]
  // professionals
  return [
    { label: 'Dashboard',        icon: '◈', to: '/professional/dashboard' },
    { label: 'Browse Projects',  icon: '◈', to: '/professional/projects' },
    { label: 'Profile',          icon: '◈', to: '/professional/profile' },
    { label: 'Messages',         icon: '◈', to: '/chat' },
  ]
}

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    homeowner: 'Homeowner',
    architect: 'Architect',
    contractor: 'Contractor',
    interior_designer: 'Interior Designer',
    vendor: 'Material Vendor',
  }
  return map[role] || role
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    const fetchUnread = async () => {
      try {
        const res = await getUnreadCount(user._id)
        setUnread(res.data.count || 0)
      } catch { /* silent */ }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [user])

  const handleLogout = () => { logout(); navigate('/login') }

  if (!user) return null

  const navItems = getNavItems(user.role)
  const displayName = user.profile?.name || user.profile?.shop_name || user.contact
  const initials = (displayName || 'U').charAt(0).toUpperCase()
  const activeLabel = navItems.find(n => location.pathname.startsWith(n.to))?.label || 'constructoR'

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <div className="sidebar-logo-icon">⬡</div>
            constructoR
          </div>
          <div className="sidebar-logo-role">{getRoleLabel(user.role)}</div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon" aria-hidden="true">◆</span>
              {item.label}
              {item.label === 'Messages' && unread > 0 && (
                <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info" onClick={() => navigate('/profile')}>
            <div className="user-avatar">{initials}</div>
            <div>
              <div className="user-name">{displayName}</div>
              <div className="user-role">{getRoleLabel(user.role)}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              ☰
            </button>
            <div>
              <div className="topbar-breadcrumb">constructoR</div>
              <div className="topbar-title">{activeLabel}</div>
            </div>
          </div>
          <div
            className="user-avatar"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/profile')}
            title={displayName}
          >
            {initials}
          </div>
        </header>

        <div className="page">
          {children}
        </div>
      </div>
    </div>
  )
}
