import { useState, useEffect } from 'react'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getUserProjects, createProject } from '../../api/api'

const CITIES = ['Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Kolkata','Pune','Ahmedabad','Jaipur','Lucknow']
const TIMELINES = ['1–3 months','3–6 months','6–12 months','1–2 years','2+ years']
const PROJECT_TYPES = ['new_construction','renovation','commercial','interior_design']
const TYPE_LABEL: Record<string,string> = { new_construction:'🏗️ New Construction', renovation:'🔨 Renovation', commercial:'🏢 Commercial', interior_design:'🎨 Interior Design' }

interface Project { _id:string; project_type:string; title:string; location:string; budget:number; timeline:string; status:string; description?:string; created_at:string }

const INIT_FORM = { project_type:'new_construction', title:'', location:'', budget:'', timeline:'', description:'' }

export default function HomeownerProjects() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(INIT_FORM)

  const load = () => {
    if (!user) return
    getUserProjects(user._id)
      .then(r => setProjects(r.data))
      .catch(() => toast('Failed to load projects', 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [user?._id])

  const handleCreate = async () => {
    if (!form.title.trim()) return toast('Please enter a project title', 'error')
    if (!form.location) return toast('Please select a location', 'error')
    if (!form.budget || parseFloat(form.budget) <= 0) return toast('Please enter a valid budget', 'error')
    if (!form.timeline) return toast('Please select a timeline', 'error')
    setSaving(true)
    try {
      const res = await createProject(user!._id, {
        project_type: form.project_type,
        title: form.title.trim(),
        location: form.location,
        budget: parseFloat(form.budget),
        timeline: form.timeline,
        description: form.description.trim(),
      })
      // Optimistic update — add new project to top of list immediately
      setProjects(prev => [res.data, ...prev])
      toast('Project created! Professionals will start bidding soon 🎉', 'success')
      setShowModal(false)
      setForm(INIT_FORM)
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to create project', 'error')
    } finally { setSaving(false) }
  }

  const statusBadge = (s: string) => {
    if (s === 'completed') return 'badge-green'
    if (s === 'in_progress') return 'badge-blue'
    return 'badge-amber'
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontSize:28,fontWeight:900,marginBottom:4}}>📋 My Projects</h1>
          <p style={{color:'var(--text-muted)'}}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Projects Yet</h3>
          <p>Create your first project to connect with professionals and get bids</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Project</button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {projects.map(p => (
            <div key={p._id} className="project-card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8,flexWrap:'wrap',gap:8}}>
                <div style={{fontWeight:800,fontSize:16}}>{p.title}</div>
                <span className={`badge ${statusBadge(p.status)}`}>{p.status.replace(/_/g,' ').toUpperCase()}</span>
              </div>
              <div className="project-meta" style={{marginBottom:8}}>
                <span>🏗️ {TYPE_LABEL[p.project_type] || p.project_type}</span>
                <span>📍 {p.location}</span>
                <span>💰 ₹{p.budget.toLocaleString('en-IN')}</span>
                <span>⏱️ {p.timeline}</span>
                <span>🗓️ {new Date(p.created_at).toLocaleDateString('en-IN')}</span>
              </div>
              {p.description && <p style={{fontSize:14,color:'var(--text-muted)',lineHeight:1.5}}>{p.description}</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">+ New Project</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Project Type</label>
              <div className="filter-chips">
                {PROJECT_TYPES.map(t => (
                  <button key={t} className={`chip ${form.project_type===t?'active':''}`} onClick={() => setForm(f=>({...f,project_type:t}))}>
                    {TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Project Title *</label>
              <input className="form-input" placeholder="e.g. 3BHK House Construction" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Location *</label>
                <select className="form-select" value={form.location} onChange={e => setForm(f=>({...f,location:e.target.value}))}>
                  <option value="">Select City</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Timeline *</label>
                <select className="form-select" value={form.timeline} onChange={e => setForm(f=>({...f,timeline:e.target.value}))}>
                  <option value="">Select Timeline</option>
                  {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Budget (₹) *</label>
              <input className="form-input" type="number" placeholder="e.g. 2500000" value={form.budget} onChange={e => setForm(f=>({...f,budget:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input form-textarea" placeholder="Describe your project requirements..." value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : '✅ Create Project'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
