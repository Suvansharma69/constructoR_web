import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useToast } from '../components/Toast'
import { updateUserProfile, updateProfessionalProfile, updateVendorProfile, uploadAvatar } from '../api/api'
import AvatarUpload from '../components/AvatarUpload'
import { ALL_STATES, getCitiesByState } from '../utils/locations'
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')

  // Common
  const [name, setName] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const availableCities = state ? getCitiesByState(state) : []

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

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true)
    try {
      const res = await uploadAvatar(user!._id, file)
      setAvatarUrl(res.data.avatar)
      toast('Avatar uploaded!', 'success')
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to upload avatar', 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSubmit = async () => {
    // Validate BEFORE setting loading — so we never freeze the spinner
    if (!state || !city) return toast('Please select state and city', 'error')
    if (role === 'homeowner' && !name) return toast('Please enter your name', 'error')
    if (isProf && (!name || !experience)) return toast('Please fill all required fields', 'error')
    if (isVendor && (!shopName || !ownerName || !address)) return toast('Please fill all required fields', 'error')

    setLoading(true)
    try {
      let res: any
      if (role === 'homeowner') {
        res = await updateUserProfile(user!._id, { name, city })
      } else if (isProf) {
        res = await updateProfessionalProfile(user!._id, {
          name, city, experience: parseInt(experience),
          specializations: specs, price_range: priceRange,
          consultation_fee: consultFee ? parseFloat(consultFee) : undefined,
        })
      } else if (isVendor) {
        res = await updateVendorProfile(user!._id, {
          shop_name: shopName, owner_name: ownerName, city, address, gst_number: gst,
        })
      }

      // API returns updated user object directly
      if (res?.data) {
        updateUser(res.data)
      }
      toast('Profile saved!', 'success')
      if (role === 'homeowner') navigate('/homeowner/build')
      else if (isVendor) navigate('/vendor/dashboard')
      else navigate('/professional/dashboard')
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to save profile', 'error')
    } finally {
      setLoading(false)
    }
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

        {/* Avatar Upload for all users */}
        <div style={{ marginBottom: '24px' }}>
          <AvatarUpload
            currentAvatar={avatarUrl}
            onUpload={handleAvatarUpload}
            loading={uploadingAvatar}
          />
        </div>

        {/* Homeowner */}
        {role === 'homeowner' && (
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          </div>
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

        {/* State and City for all */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">State / UT *</label>
            <select
              className="form-select"
              value={state}
              onChange={e => {
                setState(e.target.value)
                setCity('') // Reset city when state changes
              }}
            >
              <option value="">Select State/UT</option>
              {ALL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">City *</label>
            <select
              className="form-select"
              value={city}
              onChange={e => setCity(e.target.value)}
              disabled={!state}
            >
              <option value="">Select City</option>
              {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Save & Continue →'}
        </button>
        <button className="btn btn-outline btn-full" style={{ marginTop: 10 }} onClick={() => { logout(); navigate('/login') }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
