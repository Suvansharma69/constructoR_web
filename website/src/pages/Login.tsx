import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useToast } from '../components/Toast'
import { firebaseLogin } from '../api/api'
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from '../lib/firebase'

const ROLES = [
  { id: 'homeowner', emoji: '🏠', name: 'Home Owner', desc: 'Build or renovate your home' },
  { id: 'architect', emoji: '📐', name: 'Architect', desc: 'Design and plan projects' },
  { id: 'contractor', emoji: '🔨', name: 'Contractor', desc: 'Execute construction work' },
  { id: 'interior_designer', emoji: '🎨', name: 'Interior Designer', desc: 'Design beautiful interiors' },
  { id: 'vendor', emoji: '🏪', name: 'Material Vendor', desc: 'Sell construction materials' },
]

type Step = 'contact' | 'role' | 'auth'

/* Floating particle component */
function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 15,
    duration: Math.random() * 10 + 15,
    opacity: Math.random() * 0.3 + 0.1,
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `rgba(59, 130, 246, ${p.opacity})`,
            animation: `particleFloat ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

/* Floating particle component */
function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 15,
    duration: Math.random() * 10 + 15,
    opacity: Math.random() * 0.3 + 0.1,
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `rgba(59, 130, 246, ${p.opacity})`,
            animation: `particleFloat ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>('contact')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      toast('Please enter your email', 'error')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast('Enter a valid email address', 'error')
      return false
    }
    return true
  }

  const handleContinueToRole = () => {
    if (!validateEmail()) return
    setStep('role')
  }

  const handleContinueToAuth = () => {
    if (!role) return toast('Please select your role', 'error')
    setStep('auth')
  }

  const handleAuth = async () => {
    if (!password.trim() || password.length < 6) {
      return toast('Password must be at least 6 characters', 'error')
    }

    if (isSignUp) {
      if (!name.trim()) return toast('Please enter your full name', 'error')
      if (password !== confirmPassword) return toast('Passwords do not match', 'error')
    }

    setLoading(true)
    try {
      let firebaseUser

      if (isSignUp) {
        // Create account with Firebase
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        firebaseUser = cred.user

        // Send verification email
        await sendEmailVerification(firebaseUser)
        toast('Verification email sent! Please check your inbox.', 'success')
      } else {
        // Sign in with Firebase
        const cred = await signInWithEmailAndPassword(auth, email, password)
        firebaseUser = cred.user
      }

      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken()

      // Send to our backend to create/login user
      const res = await firebaseLogin(idToken, role, isSignUp ? name : undefined)
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
      const code = e?.code || ''
      const msg = e?.response?.data?.detail || e?.message || 'Authentication failed'

      // Friendly Firebase error messages
      if (code === 'auth/email-already-in-use') {
        toast('This email is already registered. Try signing in instead.', 'error')
        setIsSignUp(false)
      } else if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        toast('No account found with this email. Please sign up first.', 'error')
        setIsSignUp(true)
      } else if (code === 'auth/wrong-password') {
        toast('Incorrect password. Please try again.', 'error')
      } else if (code === 'auth/too-many-requests') {
        toast('Too many attempts. Please try again later.', 'error')
      } else if (code === 'auth/weak-password') {
        toast('Password is too weak. Use at least 6 characters.', 'error')
      } else {
        toast(msg, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBackToContact = () => {
    setStep('contact')
    setRole('')
    setPassword('')
    setConfirmPassword('')
  }

  const handleBackToRole = () => {
    setStep('role')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="auth-page-split">
      <div className="auth-hero">
        <Particles />
        <div className="auth-hero-overlay" />
        <div className="auth-hero-content" style={{ animation: 'slideUp 0.8s ease-out' }}>
          <h1 className="auth-hero-title">Build the Future.</h1>
          <p className="auth-hero-desc">Connecting professionals, vendors, and clients in one seamless premium marketplace.</p>
          <div style={{ display: 'flex', gap: 20, marginTop: 28 }}>
            {[{ val: '500+', label: 'Professionals' }, { val: '1000+', label: 'Projects' }, { val: '50+', label: 'Cities' }].map((s, i) => (
              <div key={i} style={{
                textAlign: 'center',
                animation: `countUp 0.5s ease-out ${0.3 + i * 0.15}s backwards`,
              }}>
                <div style={{
                  fontSize: 28, fontWeight: 900, color: 'white',
                  fontFamily: 'Outfit, sans-serif',
                }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="auth-form-side">
        <Particles />
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-title">🏗️ BuildEase</div>
            <div className="auth-logo-sub">Your Complete Construction Platform</div>
          </div>

        {/* Step 1: Email */}
        {step === 'contact' && (
          <div style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="auth-step-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</div>
            <div className="auth-step-sub">{isSignUp ? 'Enter your email to get started' : 'Sign in to your account'}</div>
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
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                onKeyDown={e => e.key === 'Enter' && handleContinueToRole()}
              />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleContinueToRole}>
              Continue →
            </button>
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-muted)' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                style={{
                  background: 'none', color: 'var(--primary-light)',
                  fontSize: 14, fontWeight: 700, textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Role Selection */}
        {step === 'role' && (
          <div style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="auth-step-title">Who are you?</div>
            <div className="auth-step-sub">Select your role to continue</div>
            <div className="roles-grid">
              {ROLES.map((r, i) => (
                <button
                  key={r.id}
                  className={`role-btn ${role === r.id ? 'selected' : ''}`}
                  onClick={() => setRole(r.id)}
                  style={{ animation: `scaleIn 0.3s ease-out ${i * 0.06}s backwards` }}
                >
                  <span className="role-emoji">{r.emoji}</span>
                  <span className="role-name">{r.name}</span>
                  <span className="role-desc">{r.desc}</span>
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={handleContinueToAuth}
              disabled={!role}
            >
              Continue →
            </button>
            <button
              className="btn btn-outline btn-full"
              style={{ marginTop: 10 }}
              onClick={handleBackToContact}
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 3: Password Auth */}
        {step === 'auth' && (
          <div style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="auth-step-title">{isSignUp ? 'Create Your Account' : 'Sign In'}</div>
            <div className="auth-step-sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                background: 'var(--primary)', color: 'white', padding: '2px 8px',
                borderRadius: 12, fontSize: 12, fontWeight: 700,
              }}>{email}</span>
            </div>

            {isSignUp && (
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  placeholder="Your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  type="text"
                />
              </div>
            )}

            <div className="form-group" style={{ marginTop: isSignUp ? 0 : 16 }}>
              <label className="form-label">Password</label>
        {step === 'otp' && (
          <div style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="auth-step-title">Verify OTP</div>
            <div className="auth-step-sub">Sent to {contact}</div>
            <div className="form-group">
              <label className="form-label">6-digit OTP</label>
              <input
                className="form-input"
                placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Enter your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                onKeyDown={e => e.key === 'Enter' && !isSignUp && handleAuth()}
              />
            </div>

            {isSignUp && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  className="form-input"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  type="password"
                  onKeyDown={e => e.key === 'Enter' && handleAuth()}
                />
              </div>
            )}

            <button className="btn btn-primary btn-full" onClick={handleAuth} disabled={loading}>
              {loading
                ? (isSignUp ? 'Creating Account...' : 'Signing In...')
                : (isSignUp ? '🚀 Create Account' : '🔓 Sign In')
              }
            </button>

            {isSignUp && (
              <div style={{
                marginTop: 12, padding: 12, borderRadius: 10,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                fontSize: 12, color: 'var(--secondary-light)', textAlign: 'center',
              }}>
                📧 A verification email will be sent to confirm your account
              </div>
            )}

            <button
              className="btn btn-outline btn-full"
              style={{ marginTop: 10 }}
              onClick={handleBackToRole}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
