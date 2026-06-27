import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from './Toast'
import { getProfessionals } from '../api/api'

interface Professional {
  _id: string; contact: string;
  profile: { name: string; city: string; experience: number; specializations: string[]; price_range?: string; bio?: string }
}

const COLORS = [
  '#3B82F6','#A855F7','#F59E0B','#14B8A6','#EF4444','#22C55E','#6366F1','#EC4899',
]

function getColor(str: string) {
  let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % COLORS.length
  return COLORS[h]
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        <div className="skeleton" style={{ width:48, height:48, borderRadius:12, flexShrink:0 }} />
        <div style={{ flex:1 }}>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" style={{ width:'40%' }} />
        </div>
      </div>
      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ width:60, height:22, borderRadius:6 }} />)}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div className="skeleton" style={{ width:100, height:18, borderRadius:6 }} />
        <div style={{ display:'flex', gap:6 }}>
          <div className="skeleton" style={{ width:70, height:28, borderRadius:8 }} />
          <div className="skeleton" style={{ width:36, height:28, borderRadius:8 }} />
        </div>
      </div>
    </div>
  )
}

interface ProfCardProps { pro: Professional; colorAccent: string; roleLabel: string }

function ProfCard({ pro, colorAccent, roleLabel }: ProfCardProps) {
  const navigate = useNavigate()
  const color = getColor(pro._id)

  return (
    <div className="pro-card">
      <div className="pro-card-header">
        <div className="pro-avatar" style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 60%, #000))` }}>
          {(pro.profile.name || 'P').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
            <div className="pro-name">{pro.profile.name}</div>
            <span className="pro-verified">✓ Verified</span>
          </div>
          <div className="pro-loc">📍 {pro.profile.city}</div>
          {pro.profile.experience > 0 && (
            <div className="pro-exp">{pro.profile.experience}+ yrs experience</div>
          )}
        </div>
        <div>
          <span className="badge" style={{ background:`${colorAccent}15`, color:colorAccent, fontSize:10 }}>{roleLabel}</span>
          <div className="pro-rating" style={{ marginTop:5 }}>
            ★★★★★ <span className="pro-rating-count">(4.9)</span>
          </div>
        </div>
      </div>

      {pro.profile.bio && (
        <p style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.55, marginBottom:10,
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {pro.profile.bio}
        </p>
      )}

      {pro.profile.specializations?.length > 0 && (
        <div className="tags">
          {pro.profile.specializations.slice(0,4).map(s => (
            <span key={s} className="tag" style={{ background:`${colorAccent}12`, color:colorAccent, borderColor:`${colorAccent}25` }}>{s}</span>
          ))}
          {pro.profile.specializations.length > 4 && (
            <span className="tag">+{pro.profile.specializations.length - 4}</span>
          )}
        </div>
      )}

      <div className="pro-footer">
        <div>
          <div className="pro-price" style={{ color: colorAccent }}>
            {pro.profile.price_range || '₹1,400–2,000'}
          </div>
          <small>/sqft</small>
        </div>
        <div className="pro-actions">
          <button
            className="btn btn-sm btn-primary"
            onClick={() => navigate(`/chat/${pro._id}`)}
            style={{ background: `linear-gradient(135deg, ${colorAccent}, color-mix(in srgb, ${colorAccent} 70%, #000))`, boxShadow:`0 2px 8px ${colorAccent}30` }}
          >
            Message
          </button>
          {pro.contact && (
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => window.open(`tel:${pro.contact}`)}
              title="Call"
            >
              📞
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface Props {
  role: 'architect' | 'contractor' | 'interior_designer'
  title: string
  emoji: string
  colorAccent: string
  roleLabel: string
  tagline: string
}

export function ProfessionalListing({ role, title, emoji, colorAccent, roleLabel, tagline }: Props) {
  const { toast } = useToast()
  const [pros, setPros] = useState<Professional[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfessionals(role)
      .then((r: any) => setPros(r.data || []))
      .catch(() => toast('Failed to load professionals', 'error'))
      .finally(() => setLoading(false))
  }, [role])

  const filtered = pros.filter(p =>
    !search ||
    p.profile.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.profile.city?.toLowerCase().includes(search.toLowerCase()) ||
    p.profile.specializations?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="page-enter">
      {/* Page header */}
      <div style={{
        background: `linear-gradient(135deg, ${colorAccent}15, ${colorAccent}05)`,
        border: `1px solid ${colorAccent}25`,
        borderRadius: 'var(--radius-lg)', padding: '24px 28px', marginBottom: 24,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
          <span style={{ fontSize:28 }}>{emoji}</span>
          <div>
            <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:900, letterSpacing:-0.5, marginBottom:2 }}>{title}</h1>
            <p style={{ color:'var(--text-muted)', fontSize:13 }}>{tagline}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:12, marginTop:12, flexWrap:'wrap' }}>
          <span className="badge" style={{ background:`${colorAccent}15`, color:colorAccent }}>
            {loading ? '...' : pros.length} verified professionals
          </span>
          <span className="badge badge-green">✓ Background checked</span>
          <span className="badge badge-blue">📋 Portfolio verified</span>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom:20 }}>
        <span className="search-icon">🔍</span>
        <input
          placeholder={`Search by name, city or specialization...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button style={{ background:'none', color:'var(--text-muted)', fontSize:16 }} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid-2">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{emoji}</div>
          <h3>{search ? 'No results found' : `No ${roleLabel.toLowerCase()}s yet`}</h3>
          <p>{search ? 'Try a different search term' : 'Check back soon — professionals are joining every day'}</p>
          {search && <button className="btn btn-outline btn-sm" onClick={() => setSearch('')}>Clear search</button>}
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map(pro => (
            <ProfCard key={pro._id} pro={pro} colorAccent={colorAccent} roleLabel={roleLabel} />
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ marginTop:20, color:'var(--text-muted)', fontSize:12, textAlign:'center' }}>
          Showing {filtered.length} of {pros.length} professionals
        </div>
      )}
    </div>
  )
}
