import { useState, useEffect } from 'react'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getUserOrders } from '../../api/api'

interface Order { _id:string; items:any[]; delivery_address:string; total_amount:number; status:string; created_at:string }

const STATUS_CONFIG: Record<string, { badge:string; label:string; icon:string }> = {
  pending:    { badge:'badge-amber', label:'Pending',     icon:'⏳' },
  confirmed:  { badge:'badge-blue',  label:'Confirmed',   icon:'✅' },
  dispatched: { badge:'badge-blue',  label:'Dispatched',  icon:'🚚' },
  delivered:  { badge:'badge-green', label:'Delivered',   icon:'📦' },
  cancelled:  { badge:'badge-red',   label:'Cancelled',   icon:'✕' },
}

function SkeletonCard() {
  return (
    <div className="skeleton-card" style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
        <div><div className="skeleton skeleton-title" style={{ width:140 }} /><div className="skeleton skeleton-text" style={{ width:100 }} /></div>
        <div className="skeleton" style={{ width:80, height:24, borderRadius:6 }} />
      </div>
      <div className="skeleton skeleton-text" /><div className="skeleton skeleton-text" style={{ width:'60%' }} />
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:14 }}>
        <div className="skeleton" style={{ width:60, height:14, borderRadius:6 }} />
        <div className="skeleton" style={{ width:100, height:22, borderRadius:6 }} />
      </div>
    </div>
  )
}

export default function HomeownerOrders() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getUserOrders(user!._id)
      .then(r => setOrders(r.data || []))
      .catch(() => toast('Failed to load orders', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const totalSpend = orders.filter(o => o.status === 'delivered').reduce((s,o) => s + (o.total_amount||0), 0)

  return (
    <div className="page-enter">
      {/* Header with stats */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:24 }}>
        <div>
          <h1 className="page-title">📦 My Orders</h1>
          <p className="page-subtitle">{orders.length} orders placed</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 16px', textAlign:'right' }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:900, color:'var(--success)' }}>₹{totalSpend.toLocaleString('en-IN')}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>Total spent</div>
          </div>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="filter-chips">
        {[
          { k:'all', label:'All' },
          { k:'pending', label:'Pending' },
          { k:'confirmed', label:'Confirmed' },
          { k:'dispatched', label:'Dispatched' },
          { k:'delivered', label:'Delivered' },
        ].map(f => (
          <button key={f.k} className={`chip ${filter === f.k ? 'active' : ''}`} onClick={() => setFilter(f.k)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div>{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No orders {filter !== 'all' ? `with status "${filter}"` : 'yet'}</h3>
          <p>Browse the material marketplace and place your first order</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {filtered.map((order, idx) => {
            const sc = STATUS_CONFIG[order.status] || { badge:'badge-grey', label:order.status, icon:'📋' }
            return (
              <div key={order._id} className="card" style={{ padding:0, overflow:'hidden' }}>
                {/* Order header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid var(--border)', flexWrap:'wrap', gap:8 }}>
                  <div>
                    <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:15, letterSpacing:-0.3, marginBottom:3 }}>
                      Order #{String(orders.indexOf(order)+1).padStart(3,'0')}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                      🗓️ {new Date(order.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                    </div>
                  </div>
                  <span className={`badge ${sc.badge}`} style={{ fontSize:12, padding:'5px 12px' }}>
                    {sc.icon} {sc.label}
                  </span>
                </div>

                {/* Order body */}
                <div style={{ padding:'14px 20px' }}>
                  {/* Items summary */}
                  {order.items?.length > 0 && (
                    <div style={{ marginBottom:10, fontSize:12, color:'var(--text-muted)' }}>
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} ordered
                    </div>
                  )}

                  {/* Delivery */}
                  <div style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'10px 12px', background:'var(--surface2)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
                    <span style={{ fontSize:14, flexShrink:0 }}>📍</span>
                    <div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>Delivery address</div>
                      <div style={{ fontSize:13 }}>{order.delivery_address}</div>
                    </div>
                  </div>
                </div>

                {/* Order footer */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid var(--border)', background:'var(--surface2)' }}>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                    {order.items?.length || 0} item(s)
                  </div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:900, color:'var(--text)' }}>
                    ₹{(order.total_amount||0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
