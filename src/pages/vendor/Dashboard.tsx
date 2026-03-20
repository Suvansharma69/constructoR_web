import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getVendorMaterials, getVendorOrders } from '../../api/api'

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

  const pending = orders.filter(o => o.status === 'pending').length
  const revenue = orders.filter(o => o.status === 'delivered').reduce((s: number, o: any) => s + (o.total_amount||0), 0)
  const displayName = user?.profile?.shop_name || user?.profile?.name || 'Vendor'

  const stats = [
    { icon:'🧱', label:'Products', value:materials.length.toString(), bg:'rgba(194,65,12,0.12)', color:'#F97316' },
    { icon:'📦', label:'Total Orders', value:orders.length.toString(), bg:'rgba(124,58,237,0.12)', color:'#A78BFA' },
    { icon:'⏳', label:'Pending', value:pending.toString(), bg:'rgba(245,158,11,0.12)', color:'#F59E0B' },
    { icon:'📈', label:'Revenue', value: revenue > 0 ? `₹${(revenue/1000).toFixed(0)}K` : '—', bg:'rgba(16,185,129,0.12)', color:'#10B981' },
  ]

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <div className="card" style={{marginBottom:28,background:'linear-gradient(135deg,rgba(194,65,12,0.15),rgba(124,58,237,0.08))'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontSize:14,color:'var(--text-muted)',marginBottom:4}}>Welcome Back 🏪</div>
            <div style={{fontSize:24,fontWeight:900,marginBottom:8}}>{displayName}</div>
            <span className="badge badge-orange">Material Vendor</span>
          </div>
          <div className="user-avatar" style={{width:56,height:56,fontSize:22,borderRadius:16,background:'linear-gradient(135deg,#C2410C,#9A3412)'}}>🏪</div>
        </div>
      </div>

      <div className="stats-grid" style={{marginBottom:28}}>
        {stats.map((s,i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon-wrap" style={{background:s.bg,fontSize:24}}>{s.icon}</div>
            <div className="stat-value" style={{color:s.color}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="section-title">Quick Actions</h2>
      <div style={{display:'flex',gap:12,marginBottom:32,flexWrap:'wrap'}}>
        <button className="btn btn-orange" onClick={() => navigate('/vendor/materials')}>+ Add Material</button>
        <button className="btn btn-outline" onClick={() => navigate('/vendor/orders')}>📦 View Orders {pending>0&&`(${pending})`}</button>
        <button className="btn btn-outline" onClick={() => navigate('/vendor/profile')}>👤 Edit Profile</button>
      </div>

      <h2 className="section-title">Recent Materials</h2>
      {materials.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🧱</div>
          <h3>No materials listed</h3>
          <p>Start adding your construction materials to sell</p>
          <button className="btn btn-primary" onClick={() => navigate('/vendor/materials')}>Add Material</button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {materials.slice(0,5).map((m: any) => (
            <div key={m._id} className="card" style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px'}}>
              <div style={{fontSize:24}}>🧱</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14}}>{m.name}</div>
                <div style={{fontSize:12,color:'var(--text-muted)'}}>{m.category}</div>
              </div>
              <div style={{fontWeight:800,color:'#F97316'}}>₹{m.price}/{m.unit||'unit'}</div>
              <span className={`badge ${m.in_stock !== false ? 'badge-green' : 'badge-red'}`}>{m.in_stock!==false?'In Stock':'Out'}</span>
            </div>
          ))}
          {materials.length > 5 && (
            <button className="btn btn-outline" style={{alignSelf:'flex-start'}} onClick={() => navigate('/vendor/materials')}>View All →</button>
          )}
        </div>
      )}
    </div>
  )
}
