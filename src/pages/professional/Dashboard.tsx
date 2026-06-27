import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getAvailableProjects, getUserProjects, getUnreadCount } from '../../api/api'

interface Project { _id:string; project_type:string; city:string; budget_range?:string; status:string; description?:string; plot_size?:number; floors?:number; created_at:string }

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div style={{ display:'flex', gap:12, marginBottom:14 }}>
        <div className="skeleton" style={{ width:40, height:40, borderRadius:10, flexShrink:0 }} />
        <div style={{ flex:1 }}>
          <div className="skeleton skeleton-title" style={{ width:'50%' }} />
          <div className="skeleton skeleton-text" style={{ width:'30%' }} />
        </div>
      </div>
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" style={{ width:'75%' }} />
    </div>
  )
}

export default function ProfessionalDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [available, setAvailable] = useState<Project[]>([])
  const [mine, setMine] = useState<Project[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const role = user?.role || 'architect'
    Promise.allSettled([
      getAvailableProjects(role),
      getUserProjects(user!._id),
      getUnreadCount(user!._id),
    ]).then(([avail, myProj, msgs]) => {
      if (avail.status === 'fulfilled') setAvailable(avail.value.data || [])
      if (myProj.status === 'fulfilled') setMine(myProj.value.data || [])
      if (msgs.status === 'fulfilled') setUnread(msgs.value.data?.count || 0)
    }).finally(() => setLoading(false))
  }, [])

  const roleConfig: Record<string, { label:string; color:string; emoji:string; grad:string }> = {
    architect:         { label:'Architect',        color:'var(--purple)',  emoji:'📐', grad:'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.05))' },
    contractor:        { label:'Contractor',       color:'var(--amber)',   emoji:'🔨', grad:'linear-gradient(135deg,rgba(217,119,6,0.15),rgba(245,158,11,0.05))' },
    interior_designer: { label:'Interior Designer',color:'var(--teal)',   emoji:'🎨', grad:'linear-gradient(135deg,rgba(13,148,136,0.15),rgba(20,184,166,0.05))' },
  }

  const cfg = roleConfig[user?.role||''] || { label:'Professional', color:'var(--accent)', emoji:'👷', grad:'var(--grad-hero)' }
  const displayName = user?.profile?.name || user?.contact || 'Professional'

  const stats = [
    { label:'Available', value: available.length, color:cfg.color, bg:`${cfg.color}14`, icon:'🔍' },
    { label:'My Projects', value: mine.length, color:'var(--success)', bg:'var(--success-bg)', icon:'💼' },
    { label:'Messages', value: unread, color:'var(--purple)', bg:'var(--purple-bg)', icon:'💬' },
    { label:'Rating', value:'4.9', color:'var(--amber)', bg:'var(--amber-bg)', icon:'⭐' },
  ]

  return (
    <div className="page-enter">
      {/* Hero banner */}
      <div className="hero-banner" style={{ background: cfg.grad, borderColor: `${cfg.color}25`, marginBottom: 28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:cfg.color, letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>
              {cfg.emoji} {cfg.label} Dashboard
            </div>
            <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:28, fontWeight:900, letterSpacing:-0.8, marginBottom:6 }}>
              Welcome back, {displayName.split(' ')[0]}
            </h1>
            <p style={{ color:'var(--text-muted)', fontSize:13, lineHeight:1.6 }}>
              {available.length > 0
                ? `${available.length} new project${available.length !== 1 ? 's' : ''} match your profile.`
                : 'Your dashboard is all set. Browse available projects.'}
            </p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/professional/projects')}>Browse Projects</button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/professional/profile')}>Update Profile</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom:28 }}>
        {stats.map((s,i) => (
          <div className="stat-card" key={i} style={{ cursor: i < 3 ? 'pointer' : 'default' }}
            onClick={() => { if(i===0) navigate('/professional/projects'); if(i===2) navigate('/chat') }}>
            <div className="stat-icon-wrap" style={{ background:s.bg }}>{s.icon}</div>
            <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Available projects */}
      <div className="section-header">
        <h2 className="section-title" style={{ marginBottom:0 }}>
          Latest Available Projects
        </h2>
        {available.length > 0 && (
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/professional/projects')}>
            View all →
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : available.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>No projects available right now</h3>
          <p>Check back later or update your profile to appear in more searches</p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/professional/profile')}>Update Profile</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {available.slice(0,5).map(p => (
            <div
              key={p._id}
              className="project-card"
              style={{ cursor:'pointer' }}
              onClick={() => navigate('/professional/projects')}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8, marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:18 }}>{p.project_type === 'build' ? '🏗️' : '🔨'}</span>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14, letterSpacing:-0.2 }}>
                      {p.project_type === 'build' ? 'New Construction' : 'Renovation Project'}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                      📍 {p.city} · {new Date(p.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                    </div>
                  </div>
                </div>
                <span className="badge badge-amber">OPEN</span>
              </div>
              <div className="project-meta" style={{ marginBottom:0 }}>
                {p.budget_range && <span>💰 {p.budget_range}</span>}
                {p.plot_size && <span>📐 {p.plot_size} sq ft</span>}
                {p.floors && <span>🏢 {p.floors} floors</span>}
              </div>
              {p.description && (
                <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:8, lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                  {p.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
