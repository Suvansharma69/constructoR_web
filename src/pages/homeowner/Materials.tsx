import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getMaterials, createOrder } from '../../api/api'

const CATEGORIES = ['All','Cement','Steel','Bricks','Tiles','Electrical','Plumbing','Paint','Hardware','Flooring','Doors & Windows']
const CAT_ICONS: Record<string,string> = { Cement:'🪨',Steel:'🔩',Bricks:'🧱',Tiles:'🔲',Electrical:'⚡',Plumbing:'💧',Paint:'🎨',Hardware:'🔧',Flooring:'🪵','Doors & Windows':'🚪' }
const CAT_COLORS: Record<string,string> = { Cement:'#6B7280',Steel:'#3B82F6',Bricks:'#EF4444',Tiles:'#8B5CF6',Electrical:'#F59E0B',Plumbing:'#06B6D4',Paint:'#EC4899',Hardware:'#78716C',Flooring:'#10B981','Doors & Windows':'#D97706' }

interface Material { _id:string; name:string; category:string; price:number; unit:string; brand?:string; description?:string; stock?:number; in_stock?:boolean; vendor_name?:string; city?:string }
interface CartItem { material: Material; qty: number }

export default function Materials() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [materials, setMaterials] = useState<Material[]>([])
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [address, setAddress] = useState('')
  const [ordering, setOrdering] = useState(false)

  useEffect(() => {
    getMaterials().then(r => setMaterials(r.data)).catch(() => toast('Failed to load materials','error')).finally(() => setLoading(false))
  }, [])

  const filtered = materials.filter(m => {
    const matchCat = category === 'All' || m.category === category
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.brand?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const addToCart = (mat: Material) => {
    setCart(p => {
      const ex = p.find(c => c.material._id === mat._id)
      if (ex) return p.map(c => c.material._id === mat._id ? {...c, qty: c.qty+1} : c)
      return [...p, {material: mat, qty: 1}]
    })
    toast(`${mat.name} added to cart 🛒`, 'success')
  }

  const removeFromCart = (id: string) => setCart(p => p.filter(c => c.material._id !== id))

  const totalAmount = cart.reduce((s,c) => s + c.material.price * c.qty, 0)

  const placeOrder = async () => {
    if (!address.trim()) return toast('Please enter delivery address','error')
    if (cart.length === 0) return
    setOrdering(true)
    try {
      await createOrder(user!._id, {
        items: cart.map(c => ({material_id: c.material._id, quantity: c.qty, price: c.material.price})),
        delivery_address: address,
        total_amount: totalAmount,
      })
      toast('Order placed successfully! 🎉','success')
      setCart([])
      setShowCart(false)
      setAddress('')
      navigate('/homeowner/orders')
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to place order','error')
    } finally { setOrdering(false) }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontSize:28,fontWeight:900,marginBottom:4}}>🧱 Material Marketplace</h1>
          <p style={{color:'var(--text-muted)'}}>{materials.length} products from verified vendors</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCart(true)} style={{position:'relative'}}>
          🛒 Cart {cart.length > 0 && <span className="badge badge-red" style={{position:'absolute',top:-8,right:-8}}>{cart.reduce((s,c)=>s+c.qty,0)}</span>}
        </button>
      </div>

      <div className="search-bar">
        <span>🔍</span>
        <input placeholder="Search materials, brands..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button style={{background:'none',color:'var(--text-muted)',fontSize:18}} onClick={() => setSearch('')}>✕</button>}
      </div>

      <div className="filter-chips">
        {CATEGORIES.map(c => (
          <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            {CAT_ICONS[c] || ''} {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🧱</div><h3>No materials found</h3></div>
      ) : (
        <div className="grid-3">
          {filtered.map(mat => (
            <div key={mat._id} className="mat-card">
              <div className="mat-top">
                <div className="mat-icon" style={{background:`${CAT_COLORS[mat.category] || '#4F46E5'}20`}}>
                  {CAT_ICONS[mat.category] || '📦'}
                </div>
                <div style={{flex:1}}>
                  <div className="mat-name">{mat.name}</div>
                  {mat.brand && <div className="mat-brand">{mat.brand}</div>}
                </div>
              </div>
              <span className="badge badge-blue" style={{marginBottom:8}}>{mat.category}</span>
              {mat.description && <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:8,lineHeight:1.5}}>{mat.description}</p>}
              {mat.vendor_name && <p style={{fontSize:11,color:'var(--text-faint)',marginBottom:8}}>🏪 {mat.vendor_name} {mat.city && `· ${mat.city}`}</p>}
              <div className="mat-footer">
                <div>
                  <div className="mat-price" style={{color:CAT_COLORS[mat.category]||'var(--primary)'}}>₹{mat.price}<span style={{fontSize:12,fontWeight:400,color:'var(--text-muted)'}}> /{mat.unit||'unit'}</span></div>
                  <div className={`mat-stock badge ${mat.in_stock !== false ? 'badge-green' : 'badge-red'}`}>
                    {mat.in_stock !== false ? '✅ In Stock' : '❌ Out'}
                  </div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => addToCart(mat)} disabled={mat.in_stock === false}>
                  Add 🛒
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCart(false) }}>
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">🛒 Your Cart ({cart.reduce((s,c)=>s+c.qty,0)} items)</span>
              <button className="modal-close" onClick={() => setShowCart(false)}>✕</button>
            </div>
            {cart.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🛒</div><h3>Cart is empty</h3></div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.material._id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
                    <div style={{fontSize:24}}>{CAT_ICONS[item.material.category]||'📦'}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14}}>{item.material.name}</div>
                      <div style={{fontSize:12,color:'var(--text-muted)'}}>₹{item.material.price} × {item.qty} = ₹{(item.material.price*item.qty).toLocaleString('en-IN')}</div>
                    </div>
                    <button className="btn btn-xs btn-danger" onClick={() => removeFromCart(item.material._id)}>✕</button>
                  </div>
                ))}
                <div style={{fontFamily:'Outfit',fontSize:20,fontWeight:900,textAlign:'right',margin:'16px 0',color:'var(--secondary)'}}>
                  Total: ₹{totalAmount.toLocaleString('en-IN')}
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Address *</label>
                  <textarea className="form-input form-textarea" placeholder="Enter full delivery address" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
                <button className="btn btn-primary btn-full" onClick={placeOrder} disabled={ordering}>
                  {ordering ? 'Placing Order...' : '✅ Place Order'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
