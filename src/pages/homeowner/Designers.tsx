import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/Toast'
import { getProfessionals } from '../../api/api'

interface Professional {
  _id: string; contact: string;
  profile: { name: string; city: string; experience: number; specializations: string[]; price_range?: string }
}

export default function Designers() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [pros, setPros] = useState<Professional[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfessionals('interior_designer').then(r => setPros(r.data)).catch(() => toast('Failed to load', 'error')).finally(() => setLoading(false))
  }, [])

  const filtered = pros.filter(p =>
    p.profile.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.profile.city?.toLowerCase().includes(search.toLowerCase()) ||
    p.profile.specializations?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <h1 style={{fontSize:28,fontWeight:900,marginBottom:4}}>🎨 Interior Designers</h1>
      <p style={{color:'var(--text-muted)',marginBottom:24}}>{pros.length} verified designers available</p>
      <div className="search-bar">
        <span>🔍</span>
        <input placeholder="Search designers..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button style={{background:'none',color:'var(--text-muted)',fontSize:18}} onClick={() => setSearch('')}>✕</button>}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🎨</div><h3>No designers found</h3></div>
      ) : (
        <div className="grid-2">
          {filtered.map(pro => (
            <div key={pro._id} className="pro-card">
              <div className="pro-card-header">
                <div className="pro-avatar" style={{background:'linear-gradient(135deg,#EC4899,#BE185D)'}}>
                  {(pro.profile.name || 'D').charAt(0).toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div className="pro-name">{pro.profile.name}</div>
                  <div className="pro-loc">📍 {pro.profile.city}</div>
                  <div className="pro-exp">⭐ {pro.profile.experience} yrs exp</div>
                </div>
                <span className="badge badge-purple">DESIGNER</span>
              </div>
              {pro.profile.specializations?.length > 0 && (
                <div className="tags">
                  {pro.profile.specializations.slice(0,3).map(s => <span key={s} className="tag" style={{background:'rgba(236,72,153,0.12)',color:'#F472B6',borderColor:'rgba(236,72,153,0.2)'}}>{s}</span>)}
                </div>
              )}
              <div className="pro-footer">
                <div>
                  <div className="pro-price" style={{color:'#EC4899'}}>{pro.profile.price_range || 'Get Quote'}</div>
                </div>
                <div className="pro-actions">
                  <button className="btn btn-sm" style={{background:'linear-gradient(135deg,#EC4899,#BE185D)',color:'white'}} onClick={() => navigate(`/chat/${pro._id}`)}>💬 Chat</button>
                  <button className="btn btn-sm btn-outline" onClick={() => window.open(`tel:${pro.contact}`)}>📞</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
