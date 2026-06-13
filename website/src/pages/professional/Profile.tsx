import { useState } from 'react'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { updateProfessionalProfile } from '../../api/supabaseApi'

const CITIES = ['Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Kolkata','Pune','Ahmedabad','Jaipur','Lucknow']
const SPECIALIZATIONS: Record<string,string[]> = {
  architect: ['Residential','Commercial','Interior','Landscape','Urban Planning','Renovation'],
  contractor: ['Civil','Structural','Electrical','Plumbing','Finishing','Waterproofing'],
  interior_designer: ['Modern','Traditional','Contemporary','Minimalist','Luxury','Office'],
}

export default function ProfessionalProfile() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name || '')
  const [city, setCity] = useState(user?.city || '')
  const [experience, setExperience] = useState(String(user?.experience || ''))
  const [specs, setSpecs] = useState<string[]>(user?.specializations || [])
  const [priceRange, setPriceRange] = useState(user?.price_range || '')
  const [consultFee, setConsultFee] = useState(String(user?.consultation_fee || ''))
  const [saving, setSaving] = useState(false)

  const roleLabel = { architect:'Architect', contractor:'Contractor', interior_designer:'Interior Designer' }[user?.role||''] || ''
  const profSpecs = SPECIALIZATIONS[user?.role||''] || []
  const toggleSpec = (s: string) => setSpecs(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const save = async () => {
    if (!user) return
    if (!name || !city || !experience) return toast('Fill all required fields','error')
    setSaving(true)
    try {
      const updated = await updateProfessionalProfile(user.id, {
        name, city, experience: parseInt(experience), specializations: specs,
        price_range: priceRange, consultation_fee: consultFee ? parseFloat(consultFee) : undefined,
      })
      updateUser(updated)
      toast('Profile updated!','success')
    } catch { toast('Failed to save','error') } finally { setSaving(false) }
  }

  return (
    <div style={{maxWidth:600}}>
      <h1 style={{fontSize:28,fontWeight:900,marginBottom:24}}>My Profile</h1>
      <div className="card" style={{marginBottom:20}}>
        <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:20}}>
          <div className="user-avatar" style={{width:64,height:64,fontSize:26,borderRadius:20}}>{name.charAt(0)||'?'}</div>
          <div>
            <div style={{fontWeight:800,fontSize:18}}>{name || 'No name'}</div>
            <span className="badge badge-blue">{roleLabel}</span>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">City *</label>
            <select className="form-select" value={city} onChange={e => setCity(e.target.value)}>
              <option value="">Select</option>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Experience (years) *</label>
            <input className="form-input" type="number" value={experience} onChange={e => setExperience(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Price Range</label>
            <input className="form-input" placeholder="e.g. ₹1400-1800/sqft" value={priceRange} onChange={e => setPriceRange(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Consultation Fee (₹)</label>
            <input className="form-input" type="number" placeholder="e.g. 5000" value={consultFee} onChange={e => setConsultFee(e.target.value)} />
          </div>
        </div>
        {profSpecs.length > 0 && (
          <div className="form-group">
            <label className="form-label">Specializations</label>
            <div className="filter-chips">
              {profSpecs.map(s => <button key={s} className={`chip ${specs.includes(s)?'active':''}`} onClick={() => toggleSpec(s)}>{s}</button>)}
            </div>
          </div>
        )}
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
      </div>
      <div className="card" style={{background:'rgba(79,70,229,0.06)'}}>
        <div style={{fontWeight:700,marginBottom:8}}>Account Info</div>
        <div style={{fontSize:14,color:'var(--text-muted)',lineHeight:2}}>
          <div>📞 {user?.contact}</div>
          <div>🔖 Role: {roleLabel}</div>
          <div>🆔 ID: {user?.id}</div>
        </div>
      </div>
    </div>
  )
}
