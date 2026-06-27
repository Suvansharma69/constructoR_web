import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useToast } from '../components/Toast'
import { updateUserProfile, updateProfessionalProfile, updateVendorProfile } from '../api/api'

const CITIES = [
  'Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Kolkata',
  'Pune','Ahmedabad','Jaipur','Lucknow','Surat','Vadodara','Nagpur','Indore',
]
const SPECIALIZATIONS: Record<string, string[]> = {
  architect:         ['Residential','Commercial','Interior','Landscape','Urban Planning','Renovation'],
  contractor:        ['Civil','Structural','Electrical','Plumbing','Finishing','Waterproofing'],
  interior_designer: ['Modern','Traditional','Contemporary','Minimalist','Luxury','Office'],
}
const ROLE_META: Record<string, { label: string; emoji: string; color: string }> = {
  homeowner:         { label: 'Home Owner',       emoji: '🏠', color: '#3B82F6' },
  architect:         { label: 'Architect',         emoji: '📐', color: '#A855F7' },
  contractor:        { label: 'Contractor',        emoji: '🔨', color: '#F59E0B' },
  interior_designer: { label: 'Interior Designer', emoji: '🎨', color: '#14B8A6' },
  vendor:            { label: 'Material Vendor',   emoji: '🏪', color: '#F97316' },
}

export default function ProfileSetup() {
  const { user, updateUser, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // Common
  const [name, setName]           = useState('')
  const [city, setCity]           = useState('')

  // Professional
  const [experience, setExperience]   = useState('')
  const [specs, setSpecs]             = useState<string[]>([])
  const [priceRange, setPriceRange]   = useState('')
  const [consultFee, setConsultFee]   = useState('')
  const [bio, setBio]                 = useState('')

  // Vendor
  const [shopName, setShopName]   = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [address, setAddress]     = useState('')
  const [gst, setGst]             = useState('')

  const role    = user?.role || ''
  const isProf  = ['architect','contractor','interior_designer'].includes(role)
  const isVendor = role === 'vendor'
  const meta    = ROLE_META[role] || { label: 'User', emoji: '👤', color: '#3B82F6' }

  const toggleSpec = (s: string) =>
    setSpecs(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const handleSubmit = async () => {
    if (!city) return toast('Please select a city', 'error')
    setLoading(true)
    try {
      let res: any
      if (role === 'homeowner') {
        if (!name.trim()) return toast('Please enter your name', 'error')
        res = await updateUserProfile(user!._id, { name: name.trim(), city })
      } else if (isProf) {
        if (!name.trim() || !experience) return toast('Please fill all required fields', 'error')
        res = await updateProfessionalProfile(user!._id, {
          name: name.trim(), city,
          experience: parseInt(experience),
          specializations: specs,
          price_range: priceRange,
          bio: bio.trim(),
          consultation_fee: consultFee ? parseFloat(consultFee) : undefined,
        })
      } else if (isVendor) {
        if (!shopName.trim() || !ownerName.trim() || !address.trim())
          return toast('Please fill all required fields', 'error')
        res = await updateVendorProfile(user!._id, {
          shop_name: shopName.trim(), owner_name: ownerName.trim(),
          city, address: address.trim(), gst_number: gst,
        })
      }
      updateUser(res.data)
      toast('Profile saved! 🎉', 'success')
      if (role === 'homeowner') navigate('/homeowner/build')
      else if (isVendor) navigate('/vendor/dashboard')
      else navigate('/professional/dashboard')
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to save profile', 'error')
    } finally { setLoading(false) }
  }

  if (!user) return null
  const profSpecs = SPECIALIZATIONS[role] || []

  return (
    <div className="auth-page">
      {/* Left — brand panel */}
      <div className="auth-brand">
        <div className="auth-brand-logo">
          <div className="auth-brand-icon">🏗️</div>
          <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900 }}>constructoR</span>
        </div>
        <div className="auth-brand-center">
          <div style={{ width:64, height:64, borderRadius:18, background:`${meta.color}15`, border:`1px solid ${meta.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, marginBottom:16 }}>
            {meta.emoji}
          </div>
          <div className="auth-brand-headline" style={{ fontSize:28 }}>
            Almost there,<br /><span>set up your profile</span>
          </div>
          <p className="auth-brand-sub">
            A complete profile helps you get the most out of constructoR — whether you're building, designing, or selling.
          </p>
          <div className="auth-brand-features">
            {[
              'Your profile is shown to potential clients',
              'Verified profiles get 3x more inquiries',
              'You can update your profile anytime',
            ].map(f => (
              <div key={f} className="auth-feature">
                <span style={{ fontSize:14 }}>✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="auth-brand-footer">© 2025 constructoR. All rights reserved.</div>
      </div>

      {/* Right — form panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          {/* Header */}
          <div style={{ marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${meta.color}15`, border:`1px solid ${meta.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                {meta.emoji}
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:meta.color, letterSpacing:1, textTransform:'uppercase' }}>{meta.label}</span>
            </div>
            <h1 className="auth-step-title" style={{ marginBottom:4 }}>Complete Your Profile</h1>
            <p className="auth-step-sub">Fill in your details to get started.</p>
          </div>

          {/* Homeowner */}
          {role === 'homeowner' && (
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
          )}

          {/* Professional */}
          {isProf && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Years of Experience *</label>
                  <input className="form-input" placeholder="e.g. 5" type="number" min="0" max="60" value={experience} onChange={e => setExperience(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Price Range</label>
                  <input className="form-input" placeholder="₹1400–1800/sqft" value={priceRange} onChange={e => setPriceRange(e.target.value)} />
                </div>
              </div>
              {role !== 'interior_designer' && (
                <div className="form-group">
                  <label className="form-label">Consultation Fee (₹)</label>
                  <input className="form-input" placeholder="e.g. 5000" type="number" min="0" value={consultFee} onChange={e => setConsultFee(e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Short Bio</label>
                <textarea className="form-input form-textarea" placeholder="Tell clients about your experience and approach..." value={bio} onChange={e => setBio(e.target.value)} rows={2} maxLength={300} />
                <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:4, textAlign:'right' }}>{bio.length}/300</div>
              </div>
              {profSpecs.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Specializations</label>
                  <div className="filter-chips">
                    {profSpecs.map(s => (
                      <button key={s} className={`chip ${specs.includes(s) ? 'active' : ''}`} onClick={() => toggleSpec(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Vendor */}
          {isVendor && (
            <>
              <div className="form-group">
                <label className="form-label">Shop Name *</label>
                <input className="form-input" placeholder="Your business name" value={shopName} onChange={e => setShopName(e.target.value)} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Name *</label>
                <input className="form-input" placeholder="Owner's full name" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Shop Address *</label>
                <textarea className="form-input form-textarea" placeholder="Full address with landmark" value={address} onChange={e => setAddress(e.target.value)} rows={2} />
              </div>
              <div className="form-group">
                <label className="form-label">GST Number <span style={{ color:'var(--text-faint)', fontWeight:400 }}>(optional)</span></label>
                <input className="form-input" placeholder="GSTIN (15 characters)" value={gst} onChange={e => setGst(e.target.value.toUpperCase())} maxLength={15} />
              </div>
            </>
          )}

          {/* City — all roles */}
          <div className="form-group">
            <label className="form-label">City *</label>
            <select className="form-select" value={city} onChange={e => setCity(e.target.value)}>
              <option value="">Select your city</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={handleSubmit}
            disabled={loading}
            style={{ marginTop:4 }}
          >
            {loading
              ? <span style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}><span className="spinner" style={{ width:16, height:16, borderWidth:2 }} /> Saving…</span>
              : 'Save & Continue →'}
          </button>
          <button
            className="btn btn-ghost btn-full"
            style={{ marginTop:8 }}
            onClick={() => { logout(); navigate('/login') }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
