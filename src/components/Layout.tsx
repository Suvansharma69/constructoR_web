import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { getUnreadCount } from '../api/api'

// ── SVG Icon Set ───────────────────────────────────────────────────────────────
const Icons: Record<string, React.ReactElement> = {
  hammer:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 12L12 9 4 17l3 3 8-8z"/><path d="M9 6L15 12"/><path d="M20 5l-3-3-5.5 5.5 3 3L20 5z"/></svg>,
  users:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  ruler:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  paint:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  box:      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  folder:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  package:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  message:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  grid:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  search:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  user:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout:   <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  home:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  chart:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
}

interface NavItem { label: string; icon: keyof typeof Icons; to: string }

function getNavItems(role: string): NavItem[] {
  if (role === 'homeowner') return [
    { label: 'Build / Renovate',   icon: 'home',    to: '/homeowner/build' },
    { label: 'Architects',         icon: 'ruler',   to: '/homeowner/architects' },
    { label: 'Contractors',        icon: 'hammer',  to: '/homeowner/contractors' },
    { label: 'Interior Designers', icon: 'paint',   to: '/homeowner/designers' },
    { label: 'Materials',          icon: 'box',     to: '/homeowner/materials' },
    { label: 'My Projects',        icon: 'folder',  to: '/homeowner/projects' },
    { label: 'My Orders',          icon: 'package', to: '/homeowner/orders' },
    { label: 'Messages',           icon: 'message', to: '/chat' },
  ]
  if (role === 'vendor') return [
    { label: 'Dashboard',  icon: 'chart',   to: '/vendor/dashboard' },
    { label: 'Products',   icon: 'box',     to: '/vendor/materials' },
    { label: 'Orders',     icon: 'package', to: '/vendor/orders' },
    { label: 'Profile',    icon: 'user',    to: '/vendor/profile' },
    { label: 'Messages',   icon: 'message', to: '/chat' },
  ]
  return [
    { label: 'Dashboard',       icon: 'chart',   to: '/professional/dashboard' },
    { label: 'Browse Projects', icon: 'search',  to: '/professional/projects' },
    { label: 'Profile',         icon: 'user',    to: '/professional/profile' },
    { label: 'Messages',        icon: 'message', to: '/chat' },
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

function getRoleAccent(role: string): string {
  const map: Record<string, string> = {
    homeowner: 'var(--accent)',
    architect: 'var(--purple)',
    contractor: 'var(--amber)',
    interior_designer: 'var(--teal)',
    vendor: 'var(--success)',
  }
  return map[role] || 'var(--accent)'
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
  const activeItem = navItems.find(n => location.pathname.startsWith(n.to))
  const roleAccent = getRoleAccent(user.role)

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
            <div className="sidebar-logo-icon">🏗️</div>
            <span style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px' }}>constructoR</span>
          </div>
          <div className="sidebar-logo-role" style={{ color: roleAccent, fontWeight: 600, fontSize: 11 }}>
            {getRoleLabel(user.role)}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon" aria-hidden="true">{Icons[item.icon]}</span>
              {item.label}
              {item.label === 'Messages' && unread > 0 && (
                <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info" onClick={() => navigate('/profile')}>
            <div className="user-avatar" style={{ background: `linear-gradient(135deg, ${roleAccent}, color-mix(in srgb, ${roleAccent} 60%, #000))` }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div className="user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </div>
              <div className="user-role">{getRoleLabel(user.role)}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            {Icons.logout}
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div>
              <div className="topbar-breadcrumb">constructoR</div>
              <div className="topbar-title">{activeItem?.label || 'Dashboard'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {unread > 0 && (
              <button
                onClick={() => navigate('/chat')}
                style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-xs)', padding: '4px 10px', color: 'var(--danger)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {Icons.message} {unread}
              </button>
            )}
            <div
              className="user-avatar"
              style={{ cursor: 'pointer', background: `linear-gradient(135deg, ${roleAccent}, color-mix(in srgb, ${roleAccent} 60%, #000))` }}
              onClick={() => navigate('/profile')}
              title={displayName}
            >
              {initials}
            </div>
          </div>
        </header>

        <div className="page page-enter">
          {children}
        </div>
      </div>
    </div>
  )
}
