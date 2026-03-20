import { useState, useEffect } from 'react'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getUserProjects, createProject } from '../../api/api'

const CITIES = ['Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Kolkata','Pune','Ahmedabad','Jaipur','Lucknow']
const BUDGET_RANGES = ['₹5L - ₹10L','₹10L - ₹20L','₹20L - ₹50L','₹50L - ₹1Cr','₹1Cr+']

interface Project { _id:string; project_type:string; city:string; budget_range?:string; status:string; description?:string; plot_size?:number; floors?:number; created_at:string }

export default function HomeownerProjects() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ project_type:'build', city:'', budget_range:'', description:'', plot_size:'', floors:'' })

  const load = () => {
    getUserProjects(user!._id).then(r => setProjects(r.data)).catch(() => toast('Failed to load','error')).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.city) return toast('Please select a city','error')
    setSaving(true)
    try {
      await createProject(user!._id, {
        project_type: form.project_type, city: form.city,
        budget_range: form.budget_range, description: form.description,
        plot_size: form.plot_size ? parseFloat(form.plot_size) : undefined,
        floors: form.floors ? parseInt(form.floors) : undefined,
      })
      toast('Project created!','success')
      setShowModal(false)
      setForm({ project_type:'build', city:'', budget_range:'', description:'', plot_size:'', floors:'' })
      load()
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed','error')
    } finally { setSaving(false) }
  }

  const statusBadge = (s: string) => {
    if (s === 'completed') return 'badge-green'
    if (s === 'pending') return 'badge-amber'
    return 'badge-blue'
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontSize:28,fontWeight:900,marginBottom:4}}>📋 My Projects</h1>
          <p style={{color:'var(--text-muted)'}}>{projects.length} projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Projects Yet</h3>
          <p>Create your first project to get started and connect with professionals</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Project</button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {projects.map(p => (
            <div key={p._id} className="project-card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12,flexWrap:'wrap',gap:8}}>
                <span className={`badge ${p.project_type==='build' ? 'badge-purple' : 'badge-blue'}`} style={{fontSize:13,padding:'6px 14px'}}>
                  {p.project_type === 'build' ? '🏗️ New Build' : '🔨 Renovation'}
                </span>
                <span className={`badge ${statusBadge(p.status)}`}>{p.status.toUpperCase()}</span>
              </div>
              <div className="project-meta">
                <span>📍 {p.city}</span>
                {p.budget_range && <span>💰 {p.budget_range}</span>}
                {p.plot_size && <span>📐 {p.plot_size} sq ft</span>}
                {p.floors && <span>🏢 {p.floors} floors</span>}
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
              <div className="toggle-group">
                <button className={`toggle-btn ${form.project_type==='build' ? 'active' : ''}`} onClick={() => setForm(f=>({...f,project_type:'build'}))}>🏗️ New Build</button>
                <button className={`toggle-btn ${form.project_type==='renovate' ? 'active' : ''}`} onClick={() => setForm(f=>({...f,project_type:'renovate'}))}>🔨 Renovation</button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">City *</label>
              <select className="form-select" value={form.city} onChange={e => setForm(f=>({...f,city:e.target.value}))}>
                <option value="">Select City</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Budget Range</label>
              <select className="form-select" value={form.budget_range} onChange={e => setForm(f=>({...f,budget_range:e.target.value}))}>
                <option value="">Select Budget</option>
                {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Plot Size (sq ft)</label>
                <input className="form-input" type="number" placeholder="e.g. 1200" value={form.plot_size} onChange={e => setForm(f=>({...f,plot_size:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Floors</label>
                <input className="form-input" type="number" placeholder="e.g. 2" value={form.floors} onChange={e => setForm(f=>({...f,floors:e.target.value}))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input form-textarea" placeholder="Describe your project..." value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : '✅ Create Project'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
