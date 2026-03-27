import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getAvailableProjects, getUserProjects, getUnreadCount } from '../../api/api'

interface Project { _id:string; project_type:string; city:string; budget_range?:string; status:string; description?:string }

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

  const roleLabel = { architect:'Architect', contractor:'Contractor', interior_designer:'Interior Designer' }[user?.role||''] || 'Professional'
  const displayName = user?.profile?.name || user?.contact || 'Professional'

  const stats = [
    { icon:'🔍', label:'Available', value: available.length.toString(), bg:'rgba(37,99,235,0.12)', color:'#60A5FA' },
    { icon:'💼', label:'My Projects', value: mine.length.toString(), bg:'rgba(16,185,129,0.12)', color:'#10B981' },
    { icon:'💬', label:'Messages', value: unread > 0 ? unread.toString() : '0', bg:'rgba(124,58,237,0.12)', color:'#A78BFA' },
    { icon:'⭐', label:'Rating', value:'4.9', bg:'rgba(245,158,11,0.12)', color:'#F59E0B' },
  ]

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      {/* Header card */}
      <div className="card" style={{
        marginBottom:28,
        background:'linear-gradient(135deg,rgba(37,99,235,0.15),rgba(79,70,229,0.1))',
        animation: 'slideUp 0.5s ease-out',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Shimmer overlay */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(90deg, transparent, rgba(37,99,235,0.06), transparent)',
          backgroundSize:'200% 100%', animation:'shimmer 4s linear infinite',
        }} />
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontSize:14,color:'var(--text-muted)',marginBottom:4}}>Welcome Back 👷</div>
            <div style={{fontSize:24,fontWeight:900,marginBottom:8}}>{displayName}</div>
            <span className="badge badge-blue">{roleLabel}</span>
          </div>
          <div className="user-avatar" style={{width:56,height:56,fontSize:22,borderRadius:16,background:'linear-gradient(135deg,#2563EB,#4F46E5)'}}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{marginBottom:28}}>
        {stats.map((s,i) => (
          <div className="stat-card" key={i} style={{ animation: `countUp 0.4s ease-out ${0.2 + i * 0.1}s backwards` }}>
            <div className="stat-icon-wrap" style={{background:s.bg,fontSize:24}}>{s.icon}</div>
            <div className="stat-value" style={{color:s.color}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="section-title">Quick Actions</h2>
      <div style={{display:'flex',gap:12,marginBottom:32,flexWrap:'wrap'}}>
        <button className="btn btn-primary" onClick={() => navigate('/professional/projects')}>🔍 Browse Projects</button>
        <button className="btn btn-outline" onClick={() => navigate('/chat')}>💬 Messages {unread>0 && `(${unread})`}</button>
        <button className="btn btn-outline" onClick={() => navigate('/professional/profile')}>👤 Update Profile</button>
      </div>

      {/* Recent Available Projects */}
      <h2 className="section-title">Recent Available Projects</h2>
      {available.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>No projects available</h3>
          <p>Check back later for new projects in your area</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {available.slice(0,5).map(p => (
            <div key={p._id} className="project-card" style={{cursor:'pointer'}} onClick={() => navigate('/professional/projects')}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                <div style={{fontWeight:700,fontSize:15}}>{p.project_type === 'build' ? '🏗️ New Build' : '🔨 Renovation'}</div>
                <span className="badge badge-amber">OPEN</span>
              </div>
              <div className="project-meta" style={{marginTop:8}}>
                <span>📍 {p.city}</span>
                {p.budget_range && <span>💰 {p.budget_range}</span>}
              </div>
            </div>
          ))}
          {available.length > 5 && (
            <button className="btn btn-outline" style={{alignSelf:'flex-start'}} onClick={() => navigate('/professional/projects')}>
              View All {available.length} Projects →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
