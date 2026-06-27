import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getAvailableProjects, bidOnProject } from '../../api/api'

interface Project {
  _id:string; project_type:string; city:string; budget_range?:string;
  status:string; description?:string; plot_size?:number; floors?:number; created_at:string
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
        <div className="skeleton" style={{ width:130, height:28, borderRadius:8 }} />
        <div className="skeleton" style={{ width:60, height:22, borderRadius:6 }} />
      </div>
      <div className="project-meta" style={{ marginBottom:10 }}>
        <div className="skeleton" style={{ width:80, height:16, borderRadius:4 }} />
        <div className="skeleton" style={{ width:80, height:16, borderRadius:4 }} />
        <div className="skeleton" style={{ width:70, height:16, borderRadius:4 }} />
      </div>
      <div className="skeleton skeleton-text" /><div className="skeleton skeleton-text" style={{ width:'70%' }} />
      <div style={{ display:'flex', gap:8, marginTop:14 }}>
        <div className="skeleton" style={{ width:100, height:30, borderRadius:8 }} />
        <div className="skeleton" style={{ width:120, height:30, borderRadius:8 }} />
      </div>
    </div>
  )
}

export default function ProfessionalProjects() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [projects, setProjects]             = useState<Project[]>([])
  const [loading, setLoading]               = useState(true)
  const [bidding, setBidding]               = useState<string|null>(null)
  const [bidForm, setBidForm]               = useState({ message:'', proposed_fee:'' })
  const [activeBidProject, setActiveBidProject] = useState<string|null>(null)
  const [search, setSearch]                 = useState('')

  useEffect(() => {
    getAvailableProjects(user?.role || 'architect')
      .then(r => setProjects(r.data || []))
      .catch(() => toast('Failed to load projects', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleBid = async (projectId: string) => {
    if (!bidForm.message.trim()) return toast('Please write a proposal message', 'error')
    if (!bidForm.proposed_fee || parseFloat(bidForm.proposed_fee) <= 0) return toast('Please enter a valid fee', 'error')
    setBidding(projectId)
    try {
      await bidOnProject(projectId, user!._id, {
        message:      bidForm.message.trim(),
        proposed_fee: parseFloat(bidForm.proposed_fee),
      })
      toast('Bid submitted! 🎉', 'success')
      setActiveBidProject(null)
      setBidForm({ message:'', proposed_fee:'' })
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to submit bid', 'error')
    } finally { setBidding(null) }
  }

  const filtered = projects.filter(p =>
    !search ||
    p.city.toLowerCase().includes(search.toLowerCase()) ||
    p.project_type.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:24 }}>
        <div>
          <h1 className="page-title">🔍 Available Projects</h1>
          <p className="page-subtitle">
            {loading ? 'Loading…' : `${projects.length} project${projects.length !== 1 ? 's' : ''} looking for professionals`}
          </p>
        </div>
        {projects.length > 0 && !loading && (
          <span className="badge badge-blue">{filtered.length} shown</span>
        )}
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom:20 }}>
        <span className="search-icon">🔍</span>
        <input
          placeholder="Search by city, type, or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button style={{ background:'none', color:'var(--text-muted)', fontSize:16 }} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>{search ? 'No projects match your search' : 'No projects available right now'}</h3>
          <p>{search ? 'Try a different keyword' : 'New projects are posted daily — check back soon'}</p>
          {search && <button className="btn btn-outline btn-sm" onClick={() => setSearch('')}>Clear search</button>}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {filtered.map(p => (
            <div key={p._id} className="project-card">
              {/* Header row */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10, marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:p.project_type==='build' ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)', border:`1px solid ${p.project_type==='build' ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                    {p.project_type === 'build' ? '🏗️' : '🔨'}
                  </div>
                  <div>
                    <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:15, letterSpacing:-0.2, marginBottom:2 }}>
                      {p.project_type === 'build' ? 'New Construction' : 'Renovation'} — {p.city}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-faint)' }}>
                      🗓️ {new Date(p.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    </div>
                  </div>
                </div>
                <span className="badge badge-amber">OPEN</span>
              </div>

              {/* Meta */}
              <div className="project-meta" style={{ marginBottom: p.description ? 10 : 14 }}>
                <span>📍 {p.city}</span>
                {p.budget_range && <span>💰 {p.budget_range}</span>}
                {p.plot_size    && <span>📐 {p.plot_size.toLocaleString('en-IN')} sq ft</span>}
                {p.floors       && <span>🏢 {p.floors} floor{p.floors !== 1 ? 's' : ''}</span>}
              </div>

              {p.description && (
                <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, marginBottom:14, padding:'10px 14px', background:'var(--surface2)', borderRadius:'var(--radius-xs)', borderLeft:'3px solid var(--border-accent)', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                  {p.description}
                </p>
              )}

              {/* Action buttons */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setActiveBidProject(activeBidProject === p._id ? null : p._id)}
                >
                  {activeBidProject === p._id ? '✕ Cancel Bid' : '📝 Submit Bid'}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate(`/chat/${p._id}`)}
                >
                  💬 Message Owner
                </button>
              </div>

              {/* Inline bid form */}
              {activeBidProject === p._id && (
                <div style={{ marginTop:16, padding:'16px 18px', background:'var(--surface2)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-accent)' }}>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:14, marginBottom:14, color:'var(--accent-light)' }}>
                    📝 Your Proposal
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proposal / Message *</label>
                    <textarea
                      className="form-input form-textarea"
                      placeholder="Describe your approach, timeline, and relevant experience..."
                      value={bidForm.message}
                      onChange={e => setBidForm(f => ({...f, message: e.target.value}))}
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Your Quote (₹) *</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      placeholder="Your total estimated fee"
                      value={bidForm.proposed_fee}
                      onChange={e => setBidForm(f => ({...f, proposed_fee: e.target.value}))}
                    />
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleBid(p._id)}
                      disabled={!!bidding || !bidForm.message.trim() || !bidForm.proposed_fee}
                    >
                      {bidding === p._id ? 'Submitting…' : '✅ Submit Bid'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setActiveBidProject(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
