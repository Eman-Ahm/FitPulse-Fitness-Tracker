import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:24, background:'#000', color:'#f0f2f8', textAlign:'center' }}>
      <div style={{ fontSize:'5rem' }}>🏋️</div>
      <h1 style={{ fontSize:'5rem', fontWeight:900, color:'#22c55e', margin:0 }}>404</h1>
      <p style={{ fontSize:'1.1rem', color:'rgba(255,255,255,.5)' }}>This page doesn't exist or was moved.</p>
      <div style={{ display:'flex', gap:12 }}>
        <Link to="/" className="btn btn-primary" style={{ background:'#22c55e', color:'#000', fontWeight:700, padding:'10px 24px', borderRadius:10, textDecoration:'none' }}>
          Back to Dashboard
        </Link>
        <Link to="/workouts" style={{ color:'rgba(255,255,255,.4)', fontSize:'.88rem', display:'flex', alignItems:'center' }}>
          View workouts →
        </Link>
      </div>
    </div>
  );
}
