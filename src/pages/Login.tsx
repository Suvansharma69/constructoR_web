import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useToast } from '../components/Toast'
import { sendOTP, verifyOTP } from '../api/api'

const ROLES = [
  { id: 'homeowner',         icon: '🏠', name: 'Home Owner',       desc: 'Build or renovate' },
  { id: 'architect',         icon: '📐', name: 'Architect',         desc: 'Design projects' },
  { id: 'contractor',        icon: '🔨', name: 'Contractor',        desc: 'Execute construction' },
  { id: 'interior_designer', icon: '🎨', name: 'Interior Designer', desc: 'Design interiors' },
  { id: 'vendor',            icon: '🏪', name: 'Material Vendor',   desc: 'Sell materials' },
]

const FEATURES = [
  { icon: '🏗️', text: 'Post projects and get competitive bids' },
  { icon: '✅', text: 'Browse verified professionals by city' },
  { icon: '📦', text: 'Order construction materials directly' },
  { icon: '💬', text: 'Real-time messaging with all parties' },
]

const STATS = [
  { val: '500+', label: 'Professionals' },
  { val: '1,200+', label: 'Projects done' },
  { val: '50+', label: 'Cities' },
  { val: '4.9★', label: 'Avg. rating' },
]

type Step = 'contact' | 'role' | 'otp'

const STEP_LABELS: Record<Step, string> = {
  contact: 'Contact',
  role:    'Role',
  otp:     'Verify',
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toast } = useToast()

  const [step, setStep]               = useState<Step>('contact')
  const [contactType, setContactType] = useState<'phone' | 'email'>('phone')
  const [contact, setContact]         = useState('')
  const [role, setRole]               = useState('')
  const [otp, setOtp]                 = useState('')
  const [loading, setLoading]         = useState(false)

  const handleSendOTP = async () => {
    if (!contact.trim()) return toast('Please enter your contact', 'error')
    if (contactType === 'phone' && !/^\d{10}$/.test(contact))
      return toast('Enter a valid 10-digit phone number', 'error')
    if (contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))
      return toast('Enter a valid email address', 'error')
    if (!role) return toast('Please select your role', 'error')
    setLoading(true)
    try {
      const res = await sendOTP(contact, contactType)
      toast('OTP sent! Check your ' + (contactType === 'phone' ? 'phone' : 'email'), 'success')
      // Show mock OTP in dev
      if (res.data?.mock_otp) {
        setTimeout(() => toast(`🔑 DEV OTP: ${res.data.mock_otp}`, 'info'), 600)
      }
      setStep('otp')
    } catch (e: any) {
      const msg = e.response?.data?.detail
      if (e.response?.status === 429) {
        toast('Too many OTP requests — please wait 10 minutes', 'error')
      } else {
        toast(msg || 'Failed to send OTP. Check your connection.', 'error')
      }
    } finally { setLoading(false) }
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return toast('Enter the 6-digit OTP', 'error')
    setLoading(true)
    try {
      const res = await verifyOTP(contact, otp, role)
      login(res.data.user, res.data.token)
      const r = res.data.user.role
      if (!res.data.user.profile_completed) navigate('/profile-setup')
      else if (r === 'homeowner') navigate('/homeowner/build')
      else if (r === 'vendor') navigate('/vendor/dashboard')
      else navigate('/professional/dashboard')
    } catch (e: any) {
      const status = e.response?.status
      const msg = e.response?.data?.detail
      if (status === 400) {
        toast(msg || 'Invalid or expired OTP. Please request a new one.', 'error')
        setOtp('')
      } else if (status === 429) {
        toast('Too many attempts — please wait and try again', 'error')
      } else {
        toast(msg || 'Verification failed. Check your connection.', 'error')
      }
    } finally { setLoading(false) }
  }

  const steps: Step[] = ['contact', 'role', 'otp']
  const stepIdx = steps.indexOf(step)

  return (
    <div className="auth-page">
      {/* Left — Brand panel */}
      <div className="auth-brand">
        <div className="auth-brand-logo">
          <div className="auth-brand-icon">🏗️</div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, letterSpacing: -0.5 }}>constructoR</span>
        </div>

        <div className="auth-brand-center">
          <div className="auth-brand-headline">
            Build better.<br /><span>Smarter.</span><br />Together.
          </div>
          <p className="auth-brand-sub">
            India's first unified platform connecting homeowners with architects, contractors, interior designers, and material vendors.
          </p>

          <div className="auth-brand-features">
            {FEATURES.map(f => (
              <div key={f.text} className="auth-feature">
                <span style={{ fontSize: 15 }}>{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>

          <div className="auth-stats">
            {STATS.map(s => (
              <div key={s.label} className="auth-stat">
                <div className="auth-stat-val">{s.val}</div>
                <div className="auth-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-brand-footer">© 2025 constructoR. All rights reserved.</div>
      </div>

      {/* Right — Form panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          {/* Step progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: i <= stepIdx ? 'var(--grad-accent)' : 'var(--surface2)',
                  border: `1px solid ${i <= stepIdx ? 'transparent' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: i <= stepIdx ? 'white' : 'var(--text-faint)',
                  transition: 'all 0.3s',
                  boxShadow: i === stepIdx ? '0 0 10px rgba(59,130,246,0.4)' : 'none',
                }}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: i <= stepIdx ? 'var(--accent-light)' : 'var(--text-faint)', transition: 'color 0.3s' }}>
                  {STEP_LABELS[s]}
                </span>
                {i < steps.length - 1 && (
                  <div style={{ height: 1, width: 24, background: i < stepIdx ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s', marginRight: 2 }} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Contact */}
          {step === 'contact' && (
            <div style={{ animation: 'slideUp 0.25s ease' }}>
              <div className="auth-step-tag">Get started</div>
              <h1 className="auth-step-title">Sign in or sign up</h1>
              <p className="auth-step-sub">Enter your phone or email — we'll send a one-time code.</p>

              <div className="toggle-group">
                <button className={`toggle-btn ${contactType === 'phone' ? 'active' : ''}`} onClick={() => setContactType('phone')}>
                  📱 Phone
                </button>
                <button className={`toggle-btn ${contactType === 'email' ? 'active' : ''}`} onClick={() => setContactType('email')}>
                  ✉️ Email
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">{contactType === 'phone' ? 'Mobile number' : 'Email address'}</label>
                <input
                  id="contact-input"
                  className="form-input"
                  placeholder={contactType === 'phone' ? '10-digit number' : 'you@example.com'}
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  type={contactType === 'email' ? 'email' : 'tel'}
                  maxLength={contactType === 'phone' ? 10 : undefined}
                  autoComplete="on"
                  onKeyDown={e => e.key === 'Enter' && contact.trim() && setStep('role')}
                />
              </div>

              <button
                id="continue-btn"
                className="btn btn-primary btn-full btn-lg"
                onClick={() => {
                  if (!contact.trim()) return toast('Please enter your contact', 'error')
                  if (contactType === 'phone' && !/^\d{10}$/.test(contact)) return toast('Enter a valid 10-digit phone number', 'error')
                  if (contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return toast('Enter a valid email address', 'error')
                  setStep('role')
                }}
              >
                Continue →
              </button>

              <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.5 }}>
                By continuing, you agree to our Terms of Service and Privacy Policy
              </div>
            </div>
          )}

          {/* Step 2: Role */}
          {step === 'role' && (
            <div style={{ animation: 'slideUp 0.25s ease' }}>
              <div className="auth-step-tag">Choose role</div>
              <h1 className="auth-step-title">How will you use constructoR?</h1>
              <p className="auth-step-sub">Select the option that best describes you.</p>

              <div className="roles-grid" style={{ marginBottom: 18 }}>
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    id={`role-${r.id}`}
                    className={`role-btn ${role === r.id ? 'selected' : ''}`}
                    onClick={() => setRole(r.id)}
                  >
                    <div className="role-icon">{r.icon}</div>
                    <div className="role-name">{r.name}</div>
                    <div className="role-desc">{r.desc}</div>
                  </button>
                ))}
              </div>

              <button
                id="send-otp-btn"
                className="btn btn-primary btn-full btn-lg"
                onClick={handleSendOTP}
                disabled={!role || loading}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Sending…
                  </span>
                ) : 'Send OTP'}
              </button>
              <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => setStep('contact')}>
                ← Back
              </button>
            </div>
          )}

          {/* Step 3: OTP */}
          {step === 'otp' && (
            <div style={{ animation: 'slideUp 0.25s ease' }}>
              <div className="auth-step-tag">Verify OTP</div>
              <h1 className="auth-step-title">Enter the code</h1>
              <p className="auth-step-sub">
                We sent a 6-digit code to <strong style={{ color: 'var(--accent-light)' }}>{contact}</strong>
              </p>

              <div className="form-group">
                <label className="form-label">One-time password</label>
                <input
                  id="otp-input"
                  className="form-input"
                  placeholder="● ● ● ● ● ●"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && otp.length === 6 && handleVerifyOTP()}
                  style={{ letterSpacing: '0.5em', fontSize: 22, textAlign: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 900 }}
                  autoFocus
                />
              </div>

              {/* OTP dots visual */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: i < otp.length ? 'var(--accent)' : 'var(--surface3)',
                    transition: 'background 0.15s',
                    boxShadow: i < otp.length ? '0 0 8px rgba(59,130,246,0.5)' : 'none',
                  }} />
                ))}
              </div>

              <button
                id="verify-btn"
                className="btn btn-primary btn-full btn-lg"
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Verifying…
                  </span>
                ) : 'Verify & Sign In'}
              </button>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={handleSendOTP} disabled={loading}>
                  Resend OTP
                </button>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep('role')}>
                  ← Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
