import { useState, useEffect } from 'react'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getUserOrders } from '../../api/api'

interface Order { _id:string; items:any[]; delivery_address:string; total_amount:number; status:string; created_at:string }

export default function HomeownerOrders() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserOrders(user!._id).then(r => setOrders(r.data)).catch(() => toast('Failed to load orders','error')).finally(() => setLoading(false))
  }, [])

  const statusBadge = (s: string) => {
    if (s === 'delivered') return 'badge-green'
    if (s === 'pending') return 'badge-amber'
    if (s === 'cancelled') return 'badge-red'
    return 'badge-blue'
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <h1 style={{fontSize:28,fontWeight:900,marginBottom:4}}>📦 My Orders</h1>
      <p style={{color:'var(--text-muted)',marginBottom:24}}>{orders.length} orders placed</p>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No Orders Yet</h3>
          <p>Browse the material marketplace and place your first order</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {orders.map((order, idx) => (
            <div key={order._id} className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12,flexWrap:'wrap',gap:8}}>
                <div>
                  <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>Order #{String(idx+1).padStart(3,'0')}</div>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>🗓️ {new Date(order.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>
                </div>
                <span className={`badge ${statusBadge(order.status)}`} style={{fontSize:12,padding:'6px 14px'}}>{order.status.toUpperCase()}</span>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>📍 Delivery to:</div>
                <div style={{fontSize:14,color:'var(--text)'}}>{order.delivery_address}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:12,borderTop:'1px solid var(--border)'}}>
                <div style={{fontSize:12,color:'var(--text-muted)'}}>{order.items?.length || 0} item(s)</div>
                <div style={{fontFamily:'Outfit',fontSize:20,fontWeight:900,color:'var(--secondary)'}}>₹{(order.total_amount||0).toLocaleString('en-IN')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
