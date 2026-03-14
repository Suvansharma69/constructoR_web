import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useToast } from '../components/Toast'
import { updateUserProfile, updateProfessionalProfile, updateVendorProfile } from '../api/api'

const CITIES = ['Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Kolkata','Pune','Ahmedabad','Jaipur','Lucknow']
const SPECIALIZATIONS: Record<string, string[]> = {
  architect: ['Residential','Commercial','Interior','Landscape','Urban Planning','Renovation'],
  contractor: ['Civil','Structural','Electrical','Plumbing','Finishing','Waterproofing'],
  interior_designer: ['Modern','Traditional','Contemporary','Minimalist','Luxury','Office'],
}

export default function ProfileSetup() {
  const { user, updateUser, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // Common
  const [name, setName] = useState('')
  const [city, setCity] = useState('')

  // Professional
  const [experience, setExperience] = useState('')
  const [specs, setSpecs] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState('')
  const [consultFee, setConsultFee] = useState('')

  // Vendor
  const [shopName, setShopName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [address, setAddress] = useState('')
  const [gst, setGst] = useState('')

  const role = user?.role || ''
  const isProf = ['architect','contractor','interior_designer'].includes(role)
  const isVendor = role === 'vendor'

  const toggleSpec = (s: string) =>
    setSpecs(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const handleSubmit = async () => {
    if (!city) return toast('Please select a city', 'error')
    setLoading(true)
    try {
      let res: any
      if (role === 'homeowner') {
        if (!name) return toast('Please enter your name', 'error')
        res = await updateUserProfile(user!._id, { name, city })
      } else if (isProf) {
        if (!name || !experience) return toast('Please fill all required fields', 'error')
        res = await updateProfessionalProfile(user!._id, {
          name, city, experience: parseInt(experience),
          specializations: specs, price_range: priceRange,
          consultation_fee: consultFee ? parseFloat(consultFee) : undefined,
        })
      } else if (isVendor) {
        if (!shopName || !ownerName || !address) return toast('Please fill all required fields', 'error')
        res = await updateVendorProfile(user!._id, {
          shop_name: shopName, owner_name: ownerName, city, address, gst_number: gst,
        })
      }
      updateUser(res.data)
      toast('Profile saved!', 'success')
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
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-card" style={{ maxWidth: 560 }}>
        <div className="auth-logo">
          <div className="auth-logo-title">Complete Your Profile</div>
          <div className="auth-logo-sub">A few details to get you started</div>
        </div>

        {/* Homeowner */}
        {role === 'homeowner' && (
          <>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          </>
        )}

        {/* Professional */}
        {isProf && (
          <>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Years of Experience *</label>
                <input className="form-input" placeholder="e.g. 5" type="number" value={experience} onChange={e => setExperience(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Price Range</label>
                <input className="form-input" placeholder="e.g. ₹1400-1800/sqft" value={priceRange} onChange={e => setPriceRange(e.target.value)} />
              </div>
            </div>
            {role !== 'interior_designer' && (
              <div className="form-group">
                <label className="form-label">Consultation Fee (₹)</label>
                <input className="form-input" placeholder="e.g. 5000" type="number" value={consultFee} onChange={e => setConsultFee(e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Specializations</label>
              <div className="filter-chips">
                {profSpecs.map(s => (
                  <button key={s} className={`chip ${specs.includes(s) ? 'active' : ''}`} onClick={() => toggleSpec(s)}>{s}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Vendor */}
        {isVendor && (
          <>
            <div className="form-group">
              <label className="form-label">Shop Name *</label>
              <input className="form-input" placeholder="Your shop name" value={shopName} onChange={e => setShopName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Owner Name *</label>
              <input className="form-input" placeholder="Owner full name" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Shop Address *</label>
              <textarea className="form-input form-textarea" placeholder="Full address" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">GST Number (optional)</label>
              <input className="form-input" placeholder="GSTIN" value={gst} onChange={e => setGst(e.target.value)} />
            </div>
          </>
        )}

        {/* City for all */}
        <div className="form-group">
          <label className="form-label">City *</label>
          <select className="form-select" value={city} onChange={e => setCity(e.target.value)}>
            <option value="">Select City</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Save & Continue →'}
        </button>
        <button className="btn btn-outline btn-full" style={{marginTop:10}} onClick={() => { logout(); navigate('/login') }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
