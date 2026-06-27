import { useState, useEffect } from 'react'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getMaterials, createOrder } from '../../api/api'

interface Material {
  _id:string; name:string; category:string; price:number; unit:string;
  brand?:string; stock:number; in_stock:boolean; vendor_name?:string; city?:string; images?:string[]
}

const CATEGORY_EMOJI: Record<string, string> = {
  Cement:'🏗️', Steel:'⚙️', Bricks:'🧱', Tiles:'🔲', Electrical:'⚡', Plumbing:'🚿',
  Paint:'🎨', Hardware:'🔩', Flooring:'🪟', 'Doors & Windows':'🚪',
}

const CATEGORIES = ['All','Cement','Steel','Bricks','Tiles','Electrical','Plumbing','Paint','Hardware','Flooring','Doors & Windows']

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div style={{ display:'flex', gap:12, marginBottom:12 }}>
        <div className="skeleton" style={{ width:44, height:44, borderRadius:10 }} />
        <div style={{ flex:1 }}>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" style={{ width:'50%' }} />
        </div>
      </div>
      <div className="skeleton skeleton-text" />
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:12 }}>
        <div className="skeleton" style={{ width:80, height:22, borderRadius:6 }} />
        <div className="skeleton" style={{ width:90, height:30, borderRadius:8 }} />
      </div>
    </div>
  )
}

export default function HomeownerMaterials() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<Map<string, number>>(new Map())
  const [ordering, setOrdering] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    getMaterials()
      .then(r => setMaterials(r.data || []))
      .catch(() => toast('Failed to load materials', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = materials.filter(m => {
    const catOk = activeCategory === 'All' || m.category === activeCategory
    const searchOk = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.brand?.toLowerCase().includes(search.toLowerCase()) ||
      m.vendor_name?.toLowerCase().includes(search.toLowerCase())
    return catOk && searchOk
  })

  const addToCart = (id: string) => {
    setCart(prev => new Map(prev).set(id, (prev.get(id) || 0) + 1))
    toast('Added to cart', 'success')
  }
  const removeFromCart = (id: string) => {
    setCart(prev => { const m = new Map(prev); const n = (m.get(id)||0)-1; if(n<=0) m.delete(id); else m.set(id,n); return m })
  }

  const cartItems = [...cart.entries()].map(([id, qty]) => ({ mat: materials.find(m => m._id === id)!, qty })).filter(x => x.mat)
  const cartTotal = cartItems.reduce((s,i) => s + i.mat.price * i.qty, 0)
  const cartCount = [...cart.values()].reduce((a,b) => a+b, 0)

  const placeOrder = async () => {
    if (!deliveryAddress.trim()) { toast('Enter delivery address', 'error'); return }
    setOrdering(true)
    try {
      await createOrder(user!._id, {
        items: cartItems.map(i => ({ material_id: i.mat._id, quantity: i.qty, price: i.mat.price })),
        delivery_address: deliveryAddress.trim(),
        total_amount: cartTotal,
      })
      setCart(new Map())
      setShowCart(false)
      setDeliveryAddress('')
      toast('Order placed successfully! 🎉', 'success')
    } catch(e: any) {
      toast(e.response?.data?.detail || 'Order failed', 'error')
    } finally { setOrdering(false) }
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:24 }}>
        <div>
          <h1 className="page-title">🏪 Material Marketplace</h1>
          <p className="page-subtitle">{materials.length} products from verified vendors</p>
        </div>
        {cartCount > 0 && (
          <button
            className="btn btn-primary"
            onClick={() => setShowCart(true)}
            style={{ position:'relative' }}
          >
            🛒 Cart
            <span style={{ background:'var(--danger)', borderRadius:10, padding:'1px 7px', fontSize:11, fontWeight:800 }}>{cartCount}</span>
            <span style={{ fontSize:12, opacity:0.8 }}>₹{cartTotal.toLocaleString('en-IN')}</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          placeholder="Search materials, brands, vendors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button style={{ background:'none', color:'var(--text-muted)', fontSize:16 }} onClick={() => setSearch('')}>✕</button>}
      </div>

      {/* Category filters */}
      <div className="filter-chips">
        {CATEGORIES.map(cat => (
          <button key={cat} className={`chip ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
            {CATEGORY_EMOJI[cat] || ''} {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>
          {filtered.length} {activeCategory !== 'All' ? activeCategory : ''} products
          {search && ` matching "${search}"`}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid-3">
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏪</div>
          <h3>No materials found</h3>
          <p>{search ? 'Try a different search term' : 'No materials in this category yet'}</p>
          {(search || activeCategory !== 'All') && (
            <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setActiveCategory('All') }}>Clear filters</button>
          )}
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(m => (
            <div key={m._id} className="mat-card">
              <div className="mat-top">
                <div className="mat-icon">
                  {CATEGORY_EMOJI[m.category] || '📦'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="mat-name" style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</div>
                  {m.brand && <div className="mat-brand">{m.brand}</div>}
                  {m.vendor_name && <div className="mat-vendor">🏪 {m.vendor_name}{m.city && ` · ${m.city}`}</div>}
                </div>
              </div>

              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                <span className="badge badge-grey">{m.category}</span>
                <span className={`badge ${m.in_stock ? 'badge-green' : 'badge-red'}`}>
                  {m.in_stock ? `✓ In Stock${m.stock > 0 ? ` (${m.stock})` : ''}` : 'Out of Stock'}
                </span>
              </div>

              <div className="mat-footer">
                <div>
                  <div className="mat-price">₹{m.price.toLocaleString('en-IN')} <span>/{m.unit}</span></div>
                </div>
                {m.in_stock ? (
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {cart.get(m._id) ? (
                      <>
                        <button className="btn btn-xs btn-ghost" onClick={() => removeFromCart(m._id)}>−</button>
                        <span style={{ fontSize:13, fontWeight:700, minWidth:20, textAlign:'center' }}>{cart.get(m._id)}</span>
                        <button className="btn btn-xs btn-primary" onClick={() => addToCart(m._id)}>+</button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-primary" onClick={() => addToCart(m._id)}>Add to Cart</button>
                    )}
                  </div>
                ) : (
                  <button className="btn btn-sm btn-ghost" disabled>Out of Stock</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cart modal */}
      {showCart && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCart(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">🛒 Your Cart ({cartCount} items)</div>
              <button className="modal-close" onClick={() => setShowCart(false)}>✕</button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
              {cartItems.map(({ mat, qty }) => (
                <div key={mat._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'var(--surface2)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
                  <span style={{ fontSize:18 }}>{CATEGORY_EMOJI[mat.category] || '📦'}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{mat.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>₹{mat.price.toLocaleString('en-IN')}/{mat.unit} × {qty}</div>
                  </div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:15, color:'var(--accent-light)' }}>
                    ₹{(mat.price * qty).toLocaleString('en-IN')}
                  </div>
                  <button className="btn btn-xs btn-ghost" style={{ color:'var(--danger)' }} onClick={() => removeFromCart(mat._id)}>✕</button>
                </div>
              ))}
            </div>

            <div style={{ background:'var(--surface2)', borderRadius:'var(--radius-sm)', padding:'14px 16px', marginBottom:16, border:'1px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700 }}>
                <span>Total</span>
                <span style={{ fontFamily:'Outfit,sans-serif', fontSize:18, color:'var(--success)' }}>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Address *</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Enter your full delivery address..."
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCart(false)}>Continue Shopping</button>
              <button className="btn btn-success" onClick={placeOrder} disabled={ordering || !deliveryAddress.trim()}>
                {ordering ? 'Placing Order...' : `Place Order · ₹${cartTotal.toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
