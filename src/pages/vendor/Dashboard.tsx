import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getVendorMaterials, getVendorOrders } from '../../api/api'

const CATEGORY_EMOJI: Record<string, string> = {
  Cement:'🏗️', Steel:'⚙️', Bricks:'🧱', Tiles:'🔲', Electrical:'⚡', Plumbing:'🚿',
  Paint:'🎨', Hardware:'🔩', Flooring:'🪟', 'Doors & Windows':'🚪',
}

export default function VendorDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [materials, setMaterials] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([getVendorMaterials(user!._id), getVendorOrders(user!._id)]).then(([m, o]) => {
      if (m.status === 'fulfilled') setMaterials(m.value.data || [])
      if (o.status === 'fulfilled') setOrders(o.value.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const pending  = orders.filter(o => o.status === 'pending').length
  const revenue  = orders.filter(o => o.status === 'delivered').reduce((s: number, o: any) => s + (o.total_amount||0), 0)
  const inStock  = materials.filter(m => m.in_stock !== false).length
  const displayName = user?.profile?.shop_name || user?.profile?.name || 'Vendor'
  const initials = displayName.charAt(0).toUpperCase()

  const stats = [
    { icon:'🧱', label:'Products', value: materials.length, color:'#F97316', bg:'rgba(249,115,22,0.12)', onClick: () => navigate('/vendor/materials') },
    { icon:'📦', label:'Total Orders', value: orders.length, color:'#A855F7', bg:'var(--purple-bg)', onClick: () => navigate('/vendor/orders') },
    { icon:'⏳', label:'Pending Orders', value: pending, color:'var(--amber)', bg:'var(--amber-bg)', onClick: () => navigate('/vendor/orders') },
    { icon:'💰', label:'Revenue', value: revenue > 0 ? `₹${(revenue/1000).toFixed(1)}K` : '₹0', color:'var(--success)', bg:'var(--success-bg)', onClick: () => {} },
  ]

  return (
    <div className="page-enter">
      {/* Hero banner */}
      <div className="hero-banner" style={{ background:'linear-gradient(135deg,rgba(249,115,22,0.12),rgba(124,58,237,0.06))', borderColor:'rgba(249,115,22,0.2)', marginBottom:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'#F97316', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>
              🏪 Vendor Dashboard
            </div>
            <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:28, fontWeight:900, letterSpacing:-0.8, marginBottom:6 }}>
              {displayName}
            </h1>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <span className="badge badge-amber">Material Vendor</span>
              <span className="badge badge-green">✓ Verified</span>
              {inStock > 0 && <span className="badge badge-blue">{inStock} items in stock</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-sm" style={{ background:'linear-gradient(135deg,#F97316,#C2410C)', color:'white' }}
              onClick={() => navigate('/vendor/materials')}>+ Add Product</button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/vendor/profile')}>Edit Profile</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom:28 }}>
        {stats.map((s, i) => (
          <div
            key={i} className="stat-card"
            style={{ cursor: i < 3 ? 'pointer' : 'default' }}
            onClick={i < 3 ? s.onClick : undefined}
          >
            <div className="stat-icon-wrap" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom:32 }}>
        <h2 className="section-title">Quick Actions</h2>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button className="btn btn-sm" style={{ background:'linear-gradient(135deg,#F97316,#C2410C)', color:'white' }}
            onClick={() => navigate('/vendor/materials')}>
            🧱 Manage Products
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/vendor/orders')}>
            📦 Orders {pending > 0 && <span style={{ background:'var(--danger)', borderRadius:10, padding:'1px 6px', fontSize:10, fontWeight:700 }}>{pending}</span>}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/chat')}>
            💬 Messages
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/vendor/profile')}>
            👤 Edit Profile
          </button>
        </div>
      </div>

      {/* Recent materials */}
      <div className="section-header">
        <h2 className="section-title" style={{ marginBottom:0 }}>Recent Products</h2>
        {materials.length > 5 && (
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/vendor/materials')}>View All →</button>
        )}
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton-card">
              <div style={{ display:'flex', gap:12 }}>
                <div className="skeleton" style={{ width:44, height:44, borderRadius:10 }} />
                <div style={{ flex:1 }}>
                  <div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" style={{ width:'40%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🧱</div>
          <h3>No products listed yet</h3>
          <p>Add your construction materials to start receiving orders from customers</p>
          <button className="btn btn-primary" onClick={() => navigate('/vendor/materials')}>Add First Product</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {materials.slice(0,5).map((m: any) => (
            <div key={m._id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', transition:'all 0.15s', cursor:'pointer' }}
              onClick={() => navigate('/vendor/materials')}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
            >
              <div style={{ width:40, height:40, borderRadius:10, background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                {CATEGORY_EMOJI[m.category] || '📦'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{m.category}</div>
              </div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, color:'#F97316', fontSize:15, flexShrink:0 }}>
                ₹{m.price?.toLocaleString('en-IN')}/{m.unit}
              </div>
              <span className={`badge ${m.in_stock !== false ? 'badge-green' : 'badge-red'}`}>
                {m.in_stock !== false ? '✓ In Stock' : 'Out'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
