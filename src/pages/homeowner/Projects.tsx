import { useState, useEffect } from 'react'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getUserProjects, createProject } from '../../api/api'

const CITIES = ['Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Kolkata','Pune','Ahmedabad','Jaipur','Lucknow','Surat','Vadodara','Nagpur','Indore','Bhopal']
const BUDGET_RANGES = ['₹5L - ₹10L','₹10L - ₹20L','₹20L - ₹50L','₹50L - ₹1Cr','₹1Cr+']

interface Project { _id:string; project_type:string; city:string; budget_range?:string; status:string; description?:string; plot_size?:number; floors?:number; created_at:string }

const STATUS_CONFIG: Record<string, { badge:string; label:string; icon:string }> = {
  pending:   { badge:'badge-amber', label:'Looking for Professionals', icon:'🔍' },
  active:    { badge:'badge-blue',  label:'In Progress',               icon:'⚡' },
  completed: { badge:'badge-green', label:'Completed',                 icon:'✓'  },
  cancelled: { badge:'badge-red',   label:'Cancelled',                 icon:'✕'  },
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
        <div className="skeleton" style={{ width:120, height:26, borderRadius:8 }} />
        <div className="skeleton" style={{ width:80, height:22, borderRadius:6 }} />
      </div>
      <div className="skeleton skeleton-text" /><div className="skeleton skeleton-text" style={{ width:'60%' }} />
      <div className="skeleton skeleton-text" style={{ width:'40%', marginTop:10 }} />
    </div>
  )
}

export default function HomeownerProjects() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ project_type:'build', city:'', budget_range:'', description:'', plot_size:'', floors:'' })

  const load = () => {
    getUserProjects(user!._id)
      .then(r => setProjects(r.data || []))
      .catch(() => toast('Failed to load projects', 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.city) return toast('Please select a city', 'error')
    setSaving(true)
    try {
      await createProject(user!._id, {
        project_type: form.project_type, city: form.city,
        budget_range: form.budget_range, description: form.description,
        plot_size: form.plot_size ? parseFloat(form.plot_size) : undefined,
        floors: form.floors ? parseInt(form.floors) : undefined,
      })
      toast('Project created! 🎉', 'success')
      setShowModal(false)
      setForm({ project_type:'build', city:'', budget_range:'', description:'', plot_size:'', floors:'' })
      load()
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to create project', 'error')
    } finally { setSaving(false) }
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:24 }}>
        <div>
          <h1 className="page-title">📋 My Projects</h1>
          <p className="page-subtitle">
            {projects.length > 0 ? `${projects.length} active project${projects.length !== 1 ? 's' : ''}` : 'No projects yet'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Projects Yet</h3>
          <p>Create your first project to connect with architects, contractors, and designers.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create First Project</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {projects.map(p => {
            const sc = STATUS_CONFIG[p.status] || { badge:'badge-grey', label:p.status, icon:'📋' }
            return (
              <div key={p._id} className="project-card">
                {/* Card header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10, marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:p.project_type==='build' ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)', border:`1px solid ${p.project_type==='build' ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                      {p.project_type === 'build' ? '🏗️' : '🔨'}
                    </div>
                    <div>
                      <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:16, letterSpacing:-0.3, marginBottom:2 }}>
                        {p.project_type === 'build' ? 'New Construction' : 'Renovation'} — {p.city}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-faint)' }}>
                        🗓️ Posted {new Date(p.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${sc.badge}`} style={{ fontSize:11, padding:'4px 10px' }}>
                    {sc.icon} {sc.label}
                  </span>
                </div>

                {/* Meta */}
                <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:12, color:'var(--text-muted)', marginBottom: p.description ? 12 : 0 }}>
                  {p.budget_range && <span style={{ display:'flex', alignItems:'center', gap:4 }}>💰 {p.budget_range}</span>}
                  {p.plot_size && <span style={{ display:'flex', alignItems:'center', gap:4 }}>📐 {p.plot_size.toLocaleString('en-IN')} sq ft</span>}
                  {p.floors && <span style={{ display:'flex', alignItems:'center', gap:4 }}>🏢 {p.floors} floor{p.floors !== 1 ? 's' : ''}</span>}
                </div>

                {p.description && (
                  <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, marginTop:10, padding:'10px 14px', background:'var(--surface2)', borderRadius:'var(--radius-xs)', borderLeft:'3px solid var(--border-accent)' }}>
                    {p.description}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">🏗️ New Project</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Project Type *</label>
              <div className="toggle-group">
                <button className={`toggle-btn ${form.project_type==='build' ? 'active' : ''}`} onClick={() => setForm(f=>({...f,project_type:'build'}))}>
                  🏗️ New Build
                </button>
                <button className={`toggle-btn ${form.project_type==='renovate' ? 'active' : ''}`} onClick={() => setForm(f=>({...f,project_type:'renovate'}))}>
                  🔨 Renovation
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">City *</label>
              <select className="form-select" value={form.city} onChange={e => setForm(f=>({...f,city:e.target.value}))}>
                <option value="">Select your city</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Budget Range</label>
              <select className="form-select" value={form.budget_range} onChange={e => setForm(f=>({...f,budget_range:e.target.value}))}>
                <option value="">Select budget range</option>
                {BUDGET_RANGES.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Plot Size (sq ft)</label>
                <input className="form-input" type="number" min="0" placeholder="e.g. 1200" value={form.plot_size} onChange={e => setForm(f=>({...f,plot_size:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">No. of Floors</label>
                <input className="form-input" type="number" min="1" max="50" placeholder="e.g. 2" value={form.floors} onChange={e => setForm(f=>({...f,floors:e.target.value}))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Project Description</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Describe your project requirements, style preferences, timeline..."
                value={form.description}
                onChange={e => setForm(f=>({...f,description:e.target.value}))}
                rows={3}
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving || !form.city}>
                {saving ? 'Creating...' : '✅ Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
