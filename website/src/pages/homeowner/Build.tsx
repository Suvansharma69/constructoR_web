import { useNavigate } from 'react-router-dom'

const PROJECT_TYPES = [
  { id: 'architects', title: 'Build From Scratch', sub: 'Complete new construction', emoji: '🏗️', gradient: 'linear-gradient(135deg,#667eea,#764ba2)', to: '/homeowner/architects' },
  { id: 'renovation', title: 'Renovation', sub: 'Upgrade your existing space', emoji: '🔨', gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', to: '/homeowner/contractors' },
  { id: 'interior', title: 'Interior Design', sub: 'Beautiful interiors & decor', emoji: '🎨', gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', to: '/homeowner/designers' },
  { id: 'extension', title: 'Home Extension', sub: 'Add more space to your home', emoji: '📐', gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', to: '/homeowner/architects' },
]

const TRUST_ITEMS = [
  { icon: '🔒', title: 'Verified Pros', desc: 'Every professional is background checked' },
  { icon: '💯', title: 'Quality Guarantee', desc: 'Assured quality on every project' },
  { icon: '📞', title: '24/7 Support', desc: 'Round the clock assistance' },
]

export default function Build() {
  const navigate = useNavigate()
  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        borderRadius: 24, overflow: 'hidden', position: 'relative',
        marginBottom: 32, minHeight: 260, display: 'flex', alignItems: 'flex-end',
        backgroundImage: 'url(/images/dashboard_banner.png)', backgroundSize: 'cover', backgroundPosition: 'center',
        padding: 36, animation: 'slideUp 0.5s ease-out',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.2) 100%)' }} />
        {/* Subtle animated shimmer overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.05) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 6s linear infinite',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: 40, fontWeight: 900, marginBottom: 8, color: 'white',
            fontFamily: 'Outfit, sans-serif',
            animation: 'slideUp 0.6s ease-out 0.1s backwards',
          }}>What would you like to build?</h1>
          <p style={{
            color: 'rgba(255,255,255,0.85)', fontSize: 16, maxWidth: 500,
            animation: 'slideUp 0.6s ease-out 0.2s backwards',
          }}>
            Choose your project type to get started with verified professionals
          </p>
        </div>
      </div>

      {/* Project Type Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
        {PROJECT_TYPES.map((pt, i) => (
          <button
            key={pt.id}
            onClick={() => navigate(pt.to)}
            style={{
              background: pt.gradient, borderRadius: 20, padding: '28px 24px',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20,
              textAlign: 'left', position: 'relative', overflow: 'hidden',
              transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s',
              animation: `slideUp 0.5s ease-out ${0.1 + i * 0.1}s backwards`,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px) scale(1.02)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 50px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = '';
              (e.currentTarget as HTMLElement).style.boxShadow = '';
            }}
          >
            {/* Animated shimmer overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: `shimmer ${4 + i}s linear infinite`,
            }} />
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, flexShrink: 0,
              border: '2px solid rgba(255,255,255,0.3)',
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
            }}>
              {pt.emoji}
            </div>
            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 4 }}>{pt.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{pt.sub}</div>
            </div>
            <span style={{
              fontSize: 28, color: 'rgba(255,255,255,0.8)',
              transition: 'transform 0.3s', position: 'relative', zIndex: 1,
            }}>→</span>
          </button>
        ))}
      </div>

      {/* Trust Badges */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
        marginTop: 40, maxWidth: 640,
      }}>
        {TRUST_ITEMS.map((item, i) => (
          <div key={i} style={{
            padding: '20px 16px', textAlign: 'center',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, transition: 'all 0.3s',
            animation: `scaleIn 0.4s ease-out ${0.5 + i * 0.1}s backwards`,
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(37,99,235,0.4)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '';
              (e.currentTarget as HTMLElement).style.transform = '';
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8, animation: `float ${3 + i}s ease-in-out infinite` }}>{item.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Stats Section */}
      <div style={{ marginTop: 40 }}>
        <h2 className="section-title" style={{ animation: 'slideUp 0.5s ease-out 0.6s backwards' }}>Why Choose BuildEase?</h2>
        <div className="stats-grid" style={{ maxWidth: 640 }}>
          {[
            { icon: '👥', val: '500+', label: 'Professionals' },
            { icon: '🏠', val: '1000+', label: 'Projects Done' },
            { icon: '⭐', val: '4.9★', label: 'Avg Rating' },
            { icon: '🏙️', val: '50+', label: 'Cities' },
          ].map((s, i) => (
            <div className="stat-card" key={i} style={{ animation: `countUp 0.5s ease-out ${0.7 + i * 0.1}s backwards` }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
              <div className="stat-value" style={{
                background: 'var(--grad-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
