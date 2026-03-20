import { useNavigate } from 'react-router-dom'

const PROJECT_TYPES = [
  { id: 'architects', title: 'Build From Scratch', sub: 'Complete new construction', emoji: '🏗️', gradient: 'linear-gradient(135deg,#667eea,#764ba2)', to: '/homeowner/architects' },
  { id: 'renovation', title: 'Renovation', sub: 'Upgrade your existing space', emoji: '🔨', gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', to: '/homeowner/contractors' },
  { id: 'interior', title: 'Interior Design', sub: 'Beautiful interiors & decor', emoji: '🎨', gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', to: '/homeowner/designers' },
  { id: 'extension', title: 'Home Extension', sub: 'Add more space to your home', emoji: '📐', gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', to: '/homeowner/architects' },
]

export default function Build() {
  const navigate = useNavigate()
  return (
    <div>
      <h1 style={{fontSize:28,fontWeight:900,marginBottom:8}}>What would you like to build?</h1>
      <p style={{color:'var(--text-muted)',marginBottom:32}}>Choose your project type to get started</p>

      <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:640}}>
        {PROJECT_TYPES.map(pt => (
          <button
            key={pt.id}
            onClick={() => navigate(pt.to)}
            style={{
              background: pt.gradient, borderRadius: 20, padding: '28px 24px',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20,
              textAlign: 'left', position: 'relative', overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.4)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
          >
            <div style={{width:72,height:72,borderRadius:20,background:'rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,flexShrink:0,border:'2px solid rgba(255,255,255,0.4)'}}>
              {pt.emoji}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:20,fontWeight:800,color:'white',marginBottom:4}}>{pt.title}</div>
              <div style={{fontSize:14,color:'rgba(255,255,255,0.85)'}}>{pt.sub}</div>
            </div>
            <span style={{fontSize:28,color:'rgba(255,255,255,0.8)'}}>→</span>
          </button>
        ))}
      </div>

      <div style={{marginTop:48}}>
        <h2 className="section-title">Why Choose BuildEase?</h2>
        <div className="stats-grid" style={{maxWidth:640}}>
          {[
            {icon:'👥', val:'500+', label:'Professionals'},
            {icon:'🏠', val:'1000+', label:'Projects Done'},
            {icon:'⭐', val:'4.9★', label:'Avg Rating'},
            {icon:'🏙️', val:'50+', label:'Cities'},
          ].map((s,i) => (
            <div className="stat-card" key={i}>
              <div style={{fontSize:32,marginBottom:8}}>{s.icon}</div>
              <div className="stat-value" style={{background:'var(--grad-primary)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
