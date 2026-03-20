import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getAvailableProjects, bidOnProject } from '../../api/api'

interface Project { _id:string; user_id?:string; project_type:string; city:string; budget_range?:string; status:string; description?:string; plot_size?:number; floors?:number; created_at:string }

export default function ProfessionalProjects() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [bidding, setBidding] = useState<string|null>(null)
  const [bidForm, setBidForm] = useState({ message:'', proposed_fee:'' })
  const [activeBidProject, setActiveBidProject] = useState<string|null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getAvailableProjects(user?.role || 'architect')
      .then(r => setProjects(r.data))
      .catch(() => toast('Failed to load projects','error'))
      .finally(() => setLoading(false))
  }, [])

  const handleBid = async (projectId: string) => {
    setBidding(projectId)
    try {
      await bidOnProject(projectId, user!._id, { message: bidForm.message, proposed_fee: bidForm.proposed_fee ? parseFloat(bidForm.proposed_fee) : undefined })
      toast('Bid submitted! 🎉','success')
      setActiveBidProject(null)
      setBidForm({ message:'', proposed_fee:'' })
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to bid','error')
    } finally { setBidding(null) }
  }

  const filtered = projects.filter(p =>
    !search || p.city.toLowerCase().includes(search.toLowerCase()) || p.project_type.includes(search.toLowerCase())
  )

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <h1 style={{fontSize:28,fontWeight:900,marginBottom:4}}>🔍 Available Projects</h1>
      <p style={{color:'var(--text-muted)',marginBottom:24}}>{projects.length} projects looking for professionals</p>

      <div className="search-bar">
        <span>🔍</span>
        <input placeholder="Search by city or type..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button style={{background:'none',color:'var(--text-muted)',fontSize:18}} onClick={() => setSearch('')}>✕</button>}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>No projects found</h3>
          <p>Check back later for new projects</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {filtered.map(p => (
            <div key={p._id} className="project-card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8,marginBottom:12}}>
                <span className={`badge ${p.project_type==='build' ? 'badge-purple' : 'badge-blue'}`} style={{fontSize:13,padding:'6px 14px'}}>
                  {p.project_type === 'build' ? '🏗️ New Build' : '🔨 Renovation'}
                </span>
                <span className="badge badge-amber">OPEN</span>
              </div>
              <div className="project-meta">
                <span>📍 {p.city}</span>
                {p.budget_range && <span>💰 {p.budget_range}</span>}
                {p.plot_size && <span>📐 {p.plot_size} sq ft</span>}
                {p.floors && <span>🏢 {p.floors} floors</span>}
                <span>🗓️ {new Date(p.created_at).toLocaleDateString('en-IN')}</span>
              </div>
              {p.description && <p style={{fontSize:14,color:'var(--text-muted)',marginBottom:12,lineHeight:1.5}}>{p.description}</p>}
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                <button className="btn btn-primary btn-sm" onClick={() => setActiveBidProject(p._id)}>📝 Submit Bid</button>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(p.user_id ? `/chat/${p.user_id}` : '/chat')}>💬 Chat with Owner</button>
              </div>

              {activeBidProject === p._id && (
                <div style={{marginTop:16,padding:16,background:'var(--bg2)',borderRadius:12,border:'1px solid var(--border)'}}>
                  <div style={{fontWeight:700,marginBottom:12}}>Submit Your Bid</div>
                  <div className="form-group">
                    <label className="form-label">Your Message</label>
                    <textarea className="form-input form-textarea" placeholder="Describe your approach..." value={bidForm.message} onChange={e => setBidForm(f=>({...f,message:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proposed Fee (₹)</label>
                    <input className="form-input" type="number" placeholder="Your quote" value={bidForm.proposed_fee} onChange={e => setBidForm(f=>({...f,proposed_fee:e.target.value}))} />
                  </div>
                  <div style={{display:'flex',gap:10}}>
                    <button className="btn btn-green btn-sm" onClick={() => handleBid(p._id)} disabled={!!bidding}>{bidding===p._id ? 'Submitting...' : '✅ Submit'}</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setActiveBidProject(null)}>Cancel</button>
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
