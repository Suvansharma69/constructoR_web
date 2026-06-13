import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useToast } from '../components/Toast'
import { sendOTP, verifyOTP } from '../api/api'

const ROLES = [
  { id: 'homeowner',         name: 'Home Owner',       desc: 'Build or renovate your home' },
  { id: 'architect',         name: 'Architect',         desc: 'Design and plan projects' },
  { id: 'contractor',        name: 'Contractor',        desc: 'Execute construction work' },
  { id: 'interior_designer', name: 'Interior Designer', desc: 'Design beautiful interiors' },
  { id: 'vendor',            name: 'Material Vendor',   desc: 'Sell construction materials' },
]

type Step = 'contact' | 'role' | 'otp'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>('contact')
  const [contactType, setContactType] = useState<'phone' | 'email'>('phone')
  const [contact, setContact] = useState('')
  const [role, setRole] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOTP = async () => {
    if (!contact.trim()) return toast('Please enter your contact', 'error')
    if (contactType === 'phone' && !/^\d{10}$/.test(contact))
      return toast('Enter a valid 10-digit phone number', 'error')
    if (contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))
      return toast('Enter a valid email address', 'error')
    if (!role) return toast('Please select your role', 'error')
    setLoading(true)
    try {
      await sendOTP(contact, contactType)
      toast('OTP sent successfully', 'success')
      setStep('otp')
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to send OTP. Check your connection.', 'error')
    } finally { setLoading(false) }
  }

  const handleVerifyOTP = async () => {
    if (!otp.trim()) return toast('Please enter the OTP', 'error')
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
      toast(e.response?.data?.detail || 'Invalid or expired OTP', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      {/* Left — Brand panel */}
      <div className="auth-brand">
        <div className="auth-brand-logo">
          <div className="auth-brand-icon">⬡</div>
          constructoR
        </div>

        <div className="auth-brand-center">
          <div className="auth-brand-headline">
            The platform<br />for modern<br /><span>construction</span>
          </div>
          <div className="auth-brand-sub">
            Connect homeowners with trusted architects, contractors,
            interior designers, and material vendors — all in one place.
          </div>
          <div className="auth-brand-features">
            {[
              'Post projects and receive competitive bids',
              'Browse verified professionals by city',
              'Order construction materials directly',
              'Real-time messaging with all parties',
            ].map(f => (
              <div key={f} className="auth-feature">
                <div className="auth-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="auth-brand-footer">
          constructoR — Professional Construction Platform
        </div>
      </div>

      {/* Right — Form panel */}
      <div className="auth-form-panel">
        <div className="auth-card">

          {/* Step: Contact */}
          {step === 'contact' && (
            <>
              <span className="auth-step-tag">Step 1 of 3</span>
              <div className="auth-step-title">Get started</div>
              <div className="auth-step-sub">Enter your phone number or email address</div>

              <div className="toggle-group" style={{ marginBottom: 14 }}>
                <button
                  className={`toggle-btn ${contactType === 'phone' ? 'active' : ''}`}
                  onClick={() => setContactType('phone')}
                >
                  Phone
                </button>
                <button
                  className={`toggle-btn ${contactType === 'email' ? 'active' : ''}`}
                  onClick={() => setContactType('email')}
                >
                  Email
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {contactType === 'phone' ? 'Mobile number' : 'Email address'}
                </label>
                <input
                  id="contact-input"
                  className="form-input"
                  placeholder={contactType === 'phone' ? '10-digit number' : 'you@example.com'}
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  type={contactType === 'email' ? 'email' : 'tel'}
                  maxLength={contactType === 'phone' ? 10 : undefined}
                  autoComplete="on"
                  onKeyDown={e => e.key === 'Enter' && setStep('role')}
                />
              </div>

              <button
                id="continue-btn"
                className="btn btn-primary btn-full btn-lg"
                onClick={() => {
                  if (!contact.trim()) { toast('Please enter contact', 'error'); return }
                  setStep('role')
                }}
              >
                Continue
              </button>
            </>
          )}

          {/* Step: Role */}
          {step === 'role' && (
            <>
              <span className="auth-step-tag">Step 2 of 3</span>
              <div className="auth-step-title">Select your role</div>
              <div className="auth-step-sub">How will you be using constructoR?</div>

              <div className="roles-grid" style={{ marginBottom: 16 }}>
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    id={`role-${r.id}`}
                    className={`role-btn ${role === r.id ? 'selected' : ''}`}
                    onClick={() => setRole(r.id)}
                  >
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
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </button>
              <button
                className="btn btn-outline btn-full"
                style={{ marginTop: 8 }}
                onClick={() => setStep('contact')}
              >
                Back
              </button>
            </>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <>
              <span className="auth-step-tag">Step 3 of 3</span>
              <div className="auth-step-title">Verify OTP</div>
              <div className="auth-step-sub">
                Sent to <strong style={{ color: 'var(--text)' }}>{contact}</strong>
              </div>

              <div className="form-group">
                <label className="form-label">6-digit OTP</label>
                <input
                  id="otp-input"
                  className="form-input"
                  placeholder="Enter the 6-digit code"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                  style={{ letterSpacing: '0.3em', fontSize: 18 }}
                />
              </div>

              <button
                id="verify-btn"
                className="btn btn-primary btn-full btn-lg"
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying…' : 'Verify & Continue'}
              </button>
              <button
                className="btn btn-ghost btn-full"
                style={{ marginTop: 8 }}
                onClick={handleSendOTP}
                disabled={loading}
              >
                Resend OTP
              </button>
              <button
                className="btn btn-outline btn-full"
                style={{ marginTop: 8 }}
                onClick={() => setStep('role')}
              >
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
