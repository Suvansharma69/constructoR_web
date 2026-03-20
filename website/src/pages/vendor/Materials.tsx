import { useState, useEffect } from 'react'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getVendorMaterials, createMaterial, deleteMaterial } from '../../api/api'

const CATEGORIES = ['Cement','Steel','Bricks','Tiles','Electrical','Plumbing','Paint','Hardware','Flooring','Doors & Windows']
const CAT_ICONS: Record<string,string> = { Cement:'🪨',Steel:'🔩',Bricks:'🧱',Tiles:'🔲',Electrical:'⚡',Plumbing:'💧',Paint:'🎨',Hardware:'🔧',Flooring:'🪵','Doors & Windows':'🚪' }

interface Material { _id:string; name:string; category:string; price:number; unit:string; brand?:string; description?:string; stock?:number; in_stock?:boolean }

const INIT = { name:'', category:'', price:'', unit:'piece', brand:'', description:'', stock:'', in_stock:true }

export default function VendorMaterials() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [mats, setMats] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string|null>(null)
  const [form, setForm] = useState(INIT)

  const load = () => {
    getVendorMaterials(user!._id).then(r => setMats(r.data)).catch(() => toast('Failed to load','error')).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.name || !form.category || !form.price) return toast('Fill name, category and price','error')
    setSaving(true)
    try {
      await createMaterial(user!._id, {
        name: form.name, category: form.category, price: parseFloat(form.price),
        unit: form.unit, brand: form.brand, description: form.description,
        stock: form.stock ? parseInt(form.stock) : 0, in_stock: form.in_stock,
        vendor_name: user?.profile?.shop_name || user?.profile?.name,
        city: user?.profile?.city,
      })
      toast('Material added!','success')
      setShowModal(false); setForm(INIT); load()
    } catch (e: any) { toast(e.response?.data?.detail||'Failed','error') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this material?')) return
    setDeleting(id)
    try {
      await deleteMaterial(id, user!._id)
      toast('Deleted','success')
      setMats(p => p.filter(m => m._id !== id))
    } catch { toast('Failed to delete','error') } finally { setDeleting(null) }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontSize:28,fontWeight:900,marginBottom:4}}>🧱 My Materials</h1>
          <p style={{color:'var(--text-muted)'}}>{mats.length} products listed</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Material</button>
      </div>

      {mats.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🧱</div>
          <h3>No materials yet</h3>
          <p>Add your first product to start selling to homeowners</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Material</button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {mats.map(m => (
            <div key={m._id} className="card" style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:56,height:56,borderRadius:16,background:'rgba(194,65,12,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>
                {CAT_ICONS[m.category]||'📦'}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:16,marginBottom:2}}>{m.name}</div>
                <div style={{fontSize:13,color:'var(--text-muted)'}}>{m.category} {m.brand && `· ${m.brand}`}</div>
                {m.description && <div style={{fontSize:12,color:'var(--text-faint)',marginTop:2}}>{m.description}</div>}
              </div>
              <div style={{textAlign:'right',marginRight:8}}>
                <div style={{fontWeight:800,fontSize:18,color:'#F97316'}}>₹{m.price}</div>
                <div style={{fontSize:12,color:'var(--text-muted)'}}>/{m.unit||'unit'}</div>
                <span className={`badge ${m.in_stock!==false ? 'badge-green':'badge-red'}`} style={{marginTop:4,display:'inline-block'}}>{m.in_stock!==false?'In Stock':'Out'}</span>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m._id)} disabled={deleting===m._id}>
                {deleting===m._id ? '...' : '🗑️'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target===e.currentTarget) setShowModal(false) }}>
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">+ Add Material</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <div className="filter-chips">
                {CATEGORIES.map(c => (
                  <button key={c} className={`chip ${form.category===c?'active':''}`} onClick={() => setForm(f=>({...f,category:c}))}>
                    {CAT_ICONS[c]} {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input className="form-input" placeholder="e.g. OPC 53 Grade Cement" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price (₹) *</label>
                <input className="form-input" type="number" placeholder="e.g. 350" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-select" value={form.unit} onChange={e => setForm(f=>({...f,unit:e.target.value}))}>
                  {['piece','bag','ton','kg','meter','sqft','liter','box','set'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Brand</label>
                <input className="form-input" placeholder="Brand name" value={form.brand} onChange={e => setForm(f=>({...f,brand:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Stock Quantity</label>
                <input className="form-input" type="number" placeholder="e.g. 100" value={form.stock} onChange={e => setForm(f=>({...f,stock:e.target.value}))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input form-textarea" placeholder="Describe the product..." value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
            </div>
            <div className="form-group">
              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                <input type="checkbox" checked={form.in_stock} onChange={e => setForm(f=>({...f,in_stock:e.target.checked}))} />
                <span className="form-label" style={{margin:0}}>In Stock</span>
              </label>
            </div>
            <button className="btn btn-primary btn-full" onClick={handleCreate} disabled={saving}>{saving ? 'Adding...' : '✅ Add Material'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
