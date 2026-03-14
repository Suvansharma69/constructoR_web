import { useState } from 'react'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { updateVendorProfile } from '../../api/api'

const CITIES = ['Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Kolkata','Pune','Ahmedabad','Jaipur','Lucknow']

export default function VendorProfile() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const p = user?.profile || {}
  const [shopName, setShopName] = useState((p as any).shop_name || '')
  const [ownerName, setOwnerName] = useState((p as any).owner_name || '')
  const [city, setCity] = useState((p as any).city || '')
  const [address, setAddress] = useState((p as any).address || '')
  const [gst, setGst] = useState((p as any).gst_number || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!shopName || !ownerName || !city || !address) return toast('Fill all required fields','error')
    setSaving(true)
    try {
      const res = await updateVendorProfile(user!._id, { shop_name: shopName, owner_name: ownerName, city, address, gst_number: gst })
      updateUser(res.data)
      toast('Profile updated!','success')
    } catch { toast('Failed to save','error') } finally { setSaving(false) }
  }

  return (
    <div style={{maxWidth:600}}>
      <h1 style={{fontSize:28,fontWeight:900,marginBottom:24}}>🏪 Shop Profile</h1>
      <div className="card" style={{marginBottom:20}}>
        <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:20}}>
          <div style={{width:64,height:64,borderRadius:20,background:'linear-gradient(135deg,#C2410C,#9A3412)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30}}>🏪</div>
          <div>
            <div style={{fontWeight:800,fontSize:18}}>{shopName||'Shop Name'}</div>
            <span className="badge badge-orange">Material Vendor</span>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Shop Name *</label>
          <input className="form-input" value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Your shop name" />
        </div>
        <div className="form-group">
          <label className="form-label">Owner Name *</label>
          <input className="form-input" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Full name" />
        </div>
        <div className="form-group">
          <label className="form-label">City *</label>
          <select className="form-select" value={city} onChange={e => setCity(e.target.value)}>
            <option value="">Select</option>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Shop Address *</label>
          <textarea className="form-input form-textarea" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full shop address" />
        </div>
        <div className="form-group">
          <label className="form-label">GST Number</label>
          <input className="form-input" value={gst} onChange={e => setGst(e.target.value)} placeholder="GSTIN (optional)" />
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : '💾 Save Profile'}</button>
      </div>
      <div className="card" style={{background:'rgba(194,65,12,0.06)'}}>
        <div style={{fontWeight:700,marginBottom:8}}>Account Info</div>
        <div style={{fontSize:14,color:'var(--text-muted)',lineHeight:2}}>
          <div>📞 {user?.contact}</div>
          <div>🔖 Role: Material Vendor</div>
          <div>🆔 ID: {user?._id}</div>
        </div>
      </div>
    </div>
  )
}
