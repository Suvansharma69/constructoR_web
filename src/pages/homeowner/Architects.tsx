import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getProfessionals } from '../../api/api'

interface Professional {
  _id: string; contact: string;
  profile: { name: string; city: string; experience: number; specializations: string[]; price_range?: string; consultation_fee?: number }
}

function ProfList({ role, title, emoji, color }: { role: string; title: string; emoji: string; color: string }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [pros, setPros] = useState<Professional[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfessionals(role).then(r => setPros(r.data)).catch(() => toast('Failed to load', 'error')).finally(() => setLoading(false))
  }, [role])

  const filtered = pros.filter(p =>
    p.profile.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.profile.city?.toLowerCase().includes(search.toLowerCase()) ||
    p.profile.specializations?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <h1 style={{fontSize:28,fontWeight:900,marginBottom:4}}>{emoji} {title}</h1>
      <p style={{color:'var(--text-muted)',marginBottom:24}}>{pros.length} verified {title.toLowerCase()} available</p>

      <div className="search-bar">
        <span>🔍</span>
        <input placeholder={`Search by name, city, specialization...`} value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button style={{background:'none',color:'var(--text-muted)',fontSize:18}} onClick={() => setSearch('')}>✕</button>}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No results found</h3>
          <p>Try different search terms</p>
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map(pro => (
            <div key={pro._id} className="pro-card">
              <div className="pro-card-header">
                <div className="pro-avatar" style={{background:`linear-gradient(135deg,${color},${color}88)`}}>
                  {(pro.profile.name || 'P').charAt(0).toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div className="pro-name">{pro.profile.name}</div>
                  <div className="pro-loc">📍 {pro.profile.city}</div>
                  <div className="pro-exp">⭐ {pro.profile.experience} yrs exp</div>
                </div>
                <span className="badge badge-blue">PRO</span>
              </div>
              {pro.profile.specializations?.length > 0 && (
                <div className="tags">
                  {pro.profile.specializations.slice(0,3).map(s => <span key={s} className="tag">{s}</span>)}
                </div>
              )}
              <div className="pro-footer">
                <div>
                  <div className="pro-price">
                    {pro.profile.price_range || (pro.profile.consultation_fee ? `₹${pro.profile.consultation_fee}` : 'Get Quote')}
                  </div>
                  <small style={{color:'var(--text-faint)',fontSize:11}}>per sq ft / consultation</small>
                </div>
                <div className="pro-actions">
                  <button className="btn btn-sm btn-green" onClick={() => navigate(`/chat/${pro._id}`)}>💬 Chat</button>
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

export default function Architects() {
  return <ProfList role="architect" title="Architects" emoji="📐" color="#4F46E5" />
}
