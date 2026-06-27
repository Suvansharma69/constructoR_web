import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'

const PROJECT_TYPES = [
  {
    id: 'build', title: 'Build From Scratch', sub: 'Complete new residential or commercial construction',
    emoji: '🏗️', color: '#3B82F6', grad: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(59,130,246,0.05))',
    to: '/homeowner/architects',
  },
  {
    id: 'renovate', title: 'Renovation', sub: 'Upgrade and modernise your existing space',
    emoji: '🔨', color: '#F59E0B', grad: 'linear-gradient(135deg, rgba(217,119,6,0.15), rgba(245,158,11,0.05))',
    to: '/homeowner/contractors',
  },
  {
    id: 'interior', title: 'Interior Design', sub: 'Beautiful interiors, furniture & decor',
    emoji: '🎨', color: '#A855F7', grad: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.05))',
    to: '/homeowner/designers',
  },
  {
    id: 'extension', title: 'Home Extension', sub: 'Add more floors, rooms or outdoor space',
    emoji: '📐', color: '#14B8A6', grad: 'linear-gradient(135deg, rgba(13,148,136,0.15), rgba(20,184,166,0.05))',
    to: '/homeowner/architects',
  },
]

const STEPS = [
  { n: '01', title: 'Choose project type', desc: 'Tell us what you want to build or renovate' },
  { n: '02', title: 'Browse professionals', desc: 'View verified architects, contractors & designers' },
  { n: '03', title: 'Get quotes & chat', desc: 'Compare bids and discuss with professionals directly' },
  { n: '04', title: 'Build your dream', desc: 'Track progress and order materials, all in one place' },
]

const PLATFORM_STATS = [
  { val: '500+', label: 'Verified Pros', color: '#60A5FA' },
  { val: '1,200+', label: 'Projects done', color: '#34D399' },
  { val: '4.9★', label: 'Average rating', color: '#FCD34D' },
  { val: '50+', label: 'Cities covered', color: '#C084FC' },
]

export default function Build() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const name = user?.profile?.name?.split(' ')[0] || 'there'

  return (
    <div className="page-enter">
      {/* Hero banner */}
      <div className="hero-banner" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              Welcome back, {name} 👋
            </div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 900, letterSpacing: -1, marginBottom: 8, lineHeight: 1.1 }}>
              What would you like<br />to build today?
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 420, lineHeight: 1.7 }}>
              Connect with India's best architects, contractors and interior designers. Get verified quotes in 24 hours.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0 }}>
            {PLATFORM_STATS.map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', minWidth: 110 }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: -0.5 }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project type cards */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.2 }}>Choose your project type</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>4 options</span>
        </div>
        <div className="grid-2">
          {PROJECT_TYPES.map(pt => (
            <button
              key={pt.id}
              onClick={() => navigate(pt.to)}
              style={{
                background: pt.grad, borderRadius: 14,
                border: `1px solid ${pt.color}25`,
                padding: '22px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 18,
                textAlign: 'left', transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = `${pt.color}60`
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${pt.color}20`
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = `${pt.color}25`
                ;(e.currentTarget as HTMLElement).style.transform = 'none'
                ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                background: `${pt.color}15`, border: `1px solid ${pt.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>{pt.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 4, letterSpacing: -0.2 }}>{pt.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{pt.sub}</div>
              </div>
              <div style={{ fontSize: 18, color: pt.color, opacity: 0.7, flexShrink: 0 }}>→</div>
            </button>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div>
        <div className="section-header">
          <h2 className="section-title" style={{ marginBottom: 0 }}>How constructoR works</h2>
        </div>
        <div className="grid-2">
          {STEPS.map(s => (
            <div key={s.n} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '18px 20px',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{
                fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 900,
                color: 'var(--accent)', background: 'var(--accent-bg)',
                border: '1px solid var(--border-accent)', borderRadius: 8,
                padding: '4px 10px', flexShrink: 0, letterSpacing: 0.5,
              }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div style={{ marginTop: 32, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/homeowner/materials')}>🏪 Browse Materials</button>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/homeowner/projects')}>📋 My Projects</button>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/homeowner/orders')}>📦 My Orders</button>
      </div>
    </div>
  )
}
