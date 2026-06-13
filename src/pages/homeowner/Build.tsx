import { useNavigate } from 'react-router-dom'

const PROJECT_TYPES = [
  { id: 'architects', title: 'Build From Scratch', sub: 'Complete new construction', bg: '#1a2340', border: '#2563EB', to: '/homeowner/architects' },
  { id: 'renovation', title: 'Renovation', sub: 'Upgrade your existing space', bg: '#1a2a20', border: '#22C55E', to: '/homeowner/contractors' },
  { id: 'interior', title: 'Interior Design', sub: 'Beautiful interiors & decor', bg: '#2a1a30', border: '#A855F7', to: '/homeowner/designers' },
  { id: 'extension', title: 'Home Extension', sub: 'Add more space to your home', bg: '#2a2010', border: '#F59E0B', to: '/homeowner/architects' },
]

export default function Build() {
  const navigate = useNavigate()
  return (
    <div>
      <h1 style={{fontSize:28,fontWeight:900,marginBottom:8}}>What would you like to build?</h1>
      <p style={{color:'var(--text-muted)',marginBottom:32}}>Choose your project type to get started</p>

      <div style={{display:'flex',flexDirection:'column',gap:10,maxWidth:560}}>
        {PROJECT_TYPES.map(pt => (
          <button
            key={pt.id}
            onClick={() => navigate(pt.to)}
            style={{
              background: pt.bg, borderRadius: 12, padding: '20px 20px',
              border: `1px solid ${pt.border}40`, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 16,
              textAlign: 'left', transition: 'border-color 0.17s, background 0.17s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = pt.border; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${pt.border}40`; }}
          >
            <div style={{width:44,height:44,borderRadius:10,background:`${pt.border}20`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:`1px solid ${pt.border}40`}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:pt.border}} />
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:2}}>{pt.title}</div>
              <div style={{fontSize:12,color:'var(--text-muted)'}}>{pt.sub}</div>
            </div>
            <span style={{fontSize:16,color:'var(--text-faint)'}}>→</span>
          </button>
        ))}
      </div>

      <div style={{marginTop:40}}>
        <div className="section-title">Platform at a glance</div>
        <div className="stats-grid" style={{maxWidth:560}}>
          {[
            {val:'500+', label:'Verified professionals'},
            {val:'1,000+', label:'Projects completed'},
            {val:'4.9', label:'Average rating'},
            {val:'50+', label:'Cities covered'},
          ].map((s,i) => (
            <div className="stat-card" key={i}>
              <div className="stat-value" style={{color:'var(--accent-light)'}}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
