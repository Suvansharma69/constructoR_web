import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useToast } from '../../components/Toast'
import { getProfessionals } from '../../api/supabaseApi'
import type { User } from '../../lib/supabase'

function ProfList({ role, title, emoji, color }: { role: string; title: string; emoji: string; color: string }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [pros, setPros] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfessionals(role)
      .then(data => setPros(data))
      .catch(() => toast('Failed to load', 'error'))
      .finally(() => setLoading(false))
  }, [role])

  const filtered = pros.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase()) ||
    p.specializations?.some(s => s.toLowerCase().includes(search.toLowerCase()))
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
            <div key={pro.id} className="pro-card">
              <div className="pro-card-header">
                <div className="pro-avatar" style={{background:`linear-gradient(135deg,${color},${color}88)`}}>
                  {(pro.name || 'P').charAt(0).toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div className="pro-name">{pro.name}</div>
                  <div className="pro-loc">📍 {pro.city}</div>
                  <div className="pro-exp">⭐ {pro.experience} yrs exp</div>
                </div>
                <span className="badge badge-blue">PRO</span>
              </div>
              {pro.specializations && pro.specializations.length > 0 && (
                <div className="tags">
                  {pro.specializations.slice(0,3).map(s => <span key={s} className="tag">{s}</span>)}
                </div>
              )}
              <div className="pro-footer">
                <div>
                  <div className="pro-price">
                    {pro.price_range || (pro.consultation_fee ? `₹${pro.consultation_fee}` : 'Get Quote')}
                  </div>
                  <small style={{color:'var(--text-faint)',fontSize:11}}>per sq ft / consultation</small>
                </div>
                <div className="pro-actions">
                  <button className="btn btn-sm btn-green" onClick={() => navigate(`/chat/${pro.id}`)}>💬 Chat</button>
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
