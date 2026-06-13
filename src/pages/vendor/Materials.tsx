import { useState, useEffect } from 'react'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getVendorMaterials, createMaterial, deleteMaterial } from '../../api/api'

const CATEGORIES = ['Cement','Steel','Bricks','Tiles','Electrical','Plumbing','Paint','Hardware','Flooring','Doors & Windows']

interface Material {
  _id: string; name: string; category: string; price: number;
  unit: string; brand?: string; description?: string; stock?: number; in_stock?: boolean
}

const INIT = { name: '', category: '', price: '', unit: 'piece', brand: '', description: '', stock: '', in_stock: true }

export default function VendorMaterials() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [mats, setMats] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState(INIT)

  const load = () => {
    getVendorMaterials(user!._id)
      .then(r => setMats(r.data))
      .catch(() => toast('Failed to load products', 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.name || !form.category || !form.price) return toast('Name, category and price are required', 'error')
    setSaving(true)
    try {
      await createMaterial(user!._id, {
        name: form.name, category: form.category,
        price: parseFloat(form.price), unit: form.unit,
        brand: form.brand, description: form.description,
        stock: form.stock ? parseInt(form.stock) : 0,
        in_stock: form.in_stock,
        vendor_name: user?.profile?.shop_name || user?.profile?.name,
        city: user?.profile?.city,
      })
      toast('Product added', 'success')
      setShowAddModal(false)
      setForm(INIT)
      load()
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to add product', 'error')
    } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMaterial(deleteTarget._id, user!._id)
      toast('Product deleted', 'success')
      setMats(p => p.filter(m => m._id !== deleteTarget._id))
      setDeleteTarget(null)
    } catch { toast('Failed to delete', 'error') }
    finally { setDeleting(false) }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <div className="flex-between mb-20">
        <div>
          <div className="page-title">Products</div>
          <div className="page-subtitle">{mats.length} product{mats.length !== 1 ? 's' : ''} listed</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Product
        </button>
      </div>

      {mats.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◫</div>
          <h3>No products yet</h3>
          <p>Add your first product to start selling to homeowners</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add Product</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mats.map(m => (
            <div key={m._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'var(--surface2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0, color: 'var(--text-muted)'
              }}>
                ◫
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {m.category}{m.brand ? ` · ${m.brand}` : ''}
                </div>
                {m.description && (
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{m.description}</div>
                )}
              </div>
              <div style={{ textAlign: 'right', marginRight: 8, flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>₹{m.price}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>/{m.unit || 'unit'}</div>
                <span className={`badge ${m.in_stock !== false ? 'badge-green' : 'badge-red'}`} style={{ marginTop: 4, display: 'inline-flex' }}>
                  {m.in_stock !== false ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setDeleteTarget(m)}
                aria-label={`Delete ${m.name}`}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Product Modal ──────────────────────────────────── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false) }}>
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Add Product</span>
              <button className="modal-close" onClick={() => setShowAddModal(false)} aria-label="Close">✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <div className="filter-chips">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    className={`chip ${form.category === c ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, category: c }))}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Product name *</label>
              <input
                className="form-input"
                placeholder="e.g. OPC 53 Grade Cement"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price (₹) *</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="e.g. 350"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  className="form-select"
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                >
                  {['piece','bag','ton','kg','meter','sqft','liter','box','set'].map(u => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Brand</label>
                <input
                  className="form-input"
                  placeholder="Brand name"
                  value={form.brand}
                  onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stock quantity</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="e.g. 100"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Describe the product..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.in_stock}
                  onChange={e => setForm(f => ({ ...f, in_stock: e.target.checked }))}
                />
                <span className="form-label" style={{ margin: 0 }}>Mark as in stock</span>
              </label>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Adding…' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal (replaces window.confirm) ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
          <div className="confirm-box">
            <div className="confirm-title">Delete product?</div>
            <div className="confirm-body">
              <strong>{deleteTarget.name}</strong> will be permanently removed from your
              product listing. This cannot be undone.
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
