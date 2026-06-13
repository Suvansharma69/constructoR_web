import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getAvailableProjects, bidOnProject } from '../../api/api'

interface Project { _id:string; user_id?:any; project_type:string; title:string; location:string; budget:number; timeline:string; status:string; description?:string; created_at:string }

const TYPE_LABEL: Record<string,string> = { new_construction:'🏗️ New Construction', renovation:'🔨 Renovation', commercial:'🏢 Commercial', interior_design:'🎨 Interior Design' }
const INIT_BID = { proposal:'', estimated_cost:'', estimated_days:'' }

export default function ProfessionalProjects() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [bidding, setBidding] = useState<string|null>(null)
  const [bidForm, setBidForm] = useState(INIT_BID)
  const [activeBidProject, setActiveBidProject] = useState<string|null>(null)
  const [submittedBids, setSubmittedBids] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    getAvailableProjects(user.role)
      .then(r => setProjects(r.data))
      .catch(() => toast('Failed to load projects', 'error'))
      .finally(() => setLoading(false))
  }, [user?.role])

  const handleBid = async (projectId: string) => {
    // Validate all required bid fields
    if (!bidForm.proposal.trim()) return toast('Please write your proposal', 'error')
    if (!bidForm.estimated_cost || parseFloat(bidForm.estimated_cost) <= 0) return toast('Please enter your cost estimate', 'error')
    if (!bidForm.estimated_days || parseInt(bidForm.estimated_days) <= 0) return toast('Please enter estimated days', 'error')

    setBidding(projectId)
    try {
      await bidOnProject(projectId, user!._id, {
        proposal: bidForm.proposal.trim(),
        estimated_cost: parseFloat(bidForm.estimated_cost),
        estimated_days: parseInt(bidForm.estimated_days),
      })
      toast('Bid submitted! 🎉 The homeowner will review your proposal.', 'success')
      setSubmittedBids(prev => new Set([...prev, projectId]))
      setActiveBidProject(null)
      setBidForm(INIT_BID)
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to submit bid', 'error')
    } finally { setBidding(null) }
  }

  const filtered = useMemo(() =>
    projects.filter(p =>
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase()) ||
      p.project_type?.toLowerCase().includes(search.toLowerCase())
    ), [projects, search])

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <h1 style={{fontSize:28,fontWeight:900,marginBottom:4}}>🔍 Available Projects</h1>
      <p style={{color:'var(--text-muted)',marginBottom:24}}>{projects.length} project{projects.length!==1?'s':''} looking for professionals</p>

      <div className="search-bar">
        <span>🔍</span>
        <input placeholder="Search by title, city or type..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button style={{background:'none',color:'var(--text-muted)',fontSize:18}} onClick={() => setSearch('')}>✕</button>}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>No projects found</h3>
          <p>Check back later for new projects matching your specialization</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {filtered.map(p => {
            const myBidSubmitted = submittedBids.has(p._id)
            const ownerId = typeof p.user_id === 'object' ? p.user_id?._id : p.user_id

            return (
              <div key={p._id} className="project-card">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8,marginBottom:8}}>
                  <div style={{fontWeight:800,fontSize:16}}>{p.title}</div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span className="badge badge-blue">{TYPE_LABEL[p.project_type] || p.project_type}</span>
                    {myBidSubmitted && <span className="badge badge-green">✅ Bid Submitted</span>}
                    {!myBidSubmitted && <span className="badge badge-amber">OPEN</span>}
                  </div>
                </div>
                <div className="project-meta" style={{marginBottom:8}}>
                  <span>📍 {p.location}</span>
                  <span>💰 ₹{p.budget?.toLocaleString('en-IN')}</span>
                  <span>⏱️ {p.timeline}</span>
                  <span>🗓️ {new Date(p.created_at).toLocaleDateString('en-IN')}</span>
                </div>
                {p.description && <p style={{fontSize:14,color:'var(--text-muted)',marginBottom:12,lineHeight:1.5}}>{p.description}</p>}

                <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                  {!myBidSubmitted && (
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      setActiveBidProject(activeBidProject === p._id ? null : p._id)
                      setBidForm(INIT_BID)
                    }}>
                      {activeBidProject === p._id ? '✕ Cancel Bid' : '📝 Submit Bid'}
                    </button>
                  )}
                  <button className="btn btn-outline btn-sm" onClick={() => navigate(ownerId ? `/chat/${ownerId}` : '/chat')}>
                    💬 Chat with Owner
                  </button>
                </div>

                {activeBidProject === p._id && !myBidSubmitted && (
                  <div style={{marginTop:16,padding:16,background:'var(--bg2)',borderRadius:12,border:'1px solid var(--border)'}}>
                    <div style={{fontWeight:700,marginBottom:12}}>📝 Your Bid Proposal</div>
                    <div className="form-group">
                      <label className="form-label">Proposal / Cover Letter *</label>
                      <textarea
                        className="form-input form-textarea"
                        placeholder="Describe your approach, experience, and why you're the right fit..."
                        value={bidForm.proposal}
                        onChange={e => setBidForm(f=>({...f,proposal:e.target.value}))}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Cost Estimate (₹) *</label>
                        <input
                          className="form-input" type="number"
                          placeholder="Your total quote"
                          value={bidForm.estimated_cost}
                          onChange={e => setBidForm(f=>({...f,estimated_cost:e.target.value}))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Estimated Days *</label>
                        <input
                          className="form-input" type="number"
                          placeholder="e.g. 90"
                          value={bidForm.estimated_days}
                          onChange={e => setBidForm(f=>({...f,estimated_days:e.target.value}))}
                        />
                      </div>
                    </div>
                    <div style={{display:'flex',gap:10}}>
                      <button className="btn btn-green btn-sm" onClick={() => handleBid(p._id)} disabled={!!bidding}>
                        {bidding===p._id ? 'Submitting...' : '✅ Submit Bid'}
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => setActiveBidProject(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
