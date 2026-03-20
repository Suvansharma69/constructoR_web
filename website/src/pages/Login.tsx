import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useToast } from '../components/Toast'
import { sendOTP, verifyOTP } from '../api/api'

const ROLES = [
  { id: 'homeowner', emoji: '🏠', name: 'Home Owner', desc: 'Build or renovate your home' },
  { id: 'architect', emoji: '📐', name: 'Architect', desc: 'Design and plan projects' },
  { id: 'contractor', emoji: '🔨', name: 'Contractor', desc: 'Execute construction work' },
  { id: 'interior_designer', emoji: '🎨', name: 'Interior Designer', desc: 'Design beautiful interiors' },
  { id: 'vendor', emoji: '🏪', name: 'Material Vendor', desc: 'Sell construction materials' },
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

  const validateContact = (): boolean => {
    if (!contact.trim()) {
      toast('Please enter your contact', 'error')
      return false
    }
    if (contactType === 'phone' && !/^\d{10}$/.test(contact)) {
      toast('Enter a valid 10-digit phone number', 'error')
      return false
    }
    if (contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      toast('Enter a valid email address', 'error')
      return false
    }
    return true
  }

  const handleContinueToRole = () => {
    if (!validateContact()) return
    setStep('role')
  }

  const handleSendOTP = async () => {
    if (!validateContact()) return
    if (!role) return toast('Please select your role', 'error')
    setLoading(true)
    try {
      const res = await sendOTP(contact, contactType)
      toast(`OTP sent! (Mock OTP: ${res.data.mock_otp || '123456'})`, 'success')
      setStep('otp')
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to send OTP', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp.trim()) return toast('Please enter the OTP', 'error')
    setLoading(true)
    try {
      const res = await verifyOTP(contact, otp, role)
      const u = res.data.user
      login(u, res.data.token)
      if (!u.profile_completed) {
        navigate('/profile-setup')
      } else {
        if (u.role === 'homeowner') navigate('/homeowner/build')
        else if (u.role === 'vendor') navigate('/vendor/dashboard')
        else navigate('/professional/dashboard')
      }
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Invalid OTP', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToContact = () => {
    setStep('contact')
    setRole('')
    setOtp('')
  }

  const handleBackToRole = () => {
    setStep('role')
    setOtp('')
  }

  return (
    <div className="auth-page-split">
      <div className="auth-hero">
        <div className="auth-hero-overlay" />
        <div className="auth-hero-content">
          <h1 className="auth-hero-title">Build the Future.</h1>
          <p className="auth-hero-desc">Connecting professionals, vendors, and clients in one seamless premium marketplace.</p>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-title">🏗️ BuildEase</div>
            <div className="auth-logo-sub">Your Complete Construction Platform</div>
          </div>

        {step === 'contact' && (
          <>
            <div className="auth-step-title">Get Started</div>
            <div className="auth-step-sub">Enter your contact details</div>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${contactType === 'phone' ? 'active' : ''}`}
                onClick={() => { setContactType('phone'); setContact('') }}
              >
                📞 Phone
              </button>
              <button
                className={`toggle-btn ${contactType === 'email' ? 'active' : ''}`}
                onClick={() => { setContactType('email'); setContact('') }}
              >
                ✉️ Email
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">{contactType === 'phone' ? 'Mobile Number' : 'Email Address'}</label>
              <input
                className="form-input"
                placeholder={contactType === 'phone' ? '10-digit number' : 'you@example.com'}
                value={contact}
                onChange={e => setContact(e.target.value)}
                type={contactType === 'email' ? 'email' : 'tel'}
                maxLength={contactType === 'phone' ? 10 : undefined}
                onKeyDown={e => e.key === 'Enter' && handleContinueToRole()}
              />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleContinueToRole}>
              Continue →
            </button>
          </>
        )}

        {step === 'role' && (
          <>
            <div className="auth-step-title">Who are you?</div>
            <div className="auth-step-sub">Select your role to continue</div>
            <div className="roles-grid">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  className={`role-btn ${role === r.id ? 'selected' : ''}`}
                  onClick={() => setRole(r.id)}
                >
                  <span className="role-emoji">{r.emoji}</span>
                  <span className="role-name">{r.name}</span>
                  <span className="role-desc">{r.desc}</span>
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={handleSendOTP}
              disabled={!role || loading}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <button
              className="btn btn-outline btn-full"
              style={{ marginTop: 10 }}
              onClick={handleBackToContact}
            >
              ← Back
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="auth-step-title">Verify OTP</div>
            <div className="auth-step-sub">Sent to {contact}</div>
            <div className="form-group">
              <label className="form-label">6-digit OTP</label>
              <input
                className="form-input"
                placeholder="Enter OTP (123456 for testing)"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                type="number"
                maxLength={6}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
              />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleVerifyOTP} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue →'}
            </button>
            <button
              className="btn btn-outline btn-full"
              style={{ marginTop: 10 }}
              onClick={handleSendOTP}
              disabled={loading}
            >
              Resend OTP
            </button>
            <button
              className="btn btn-outline btn-full"
              style={{ marginTop: 10 }}
              onClick={handleBackToRole}
            >
              ← Back
            </button>
          </>
        )}
      </div>
      </div>
    </div>
  )
}
