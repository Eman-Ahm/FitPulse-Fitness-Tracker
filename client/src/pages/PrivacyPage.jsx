export default function PrivacyPage() {
  return (
    <div style={{ maxWidth:720, margin:'0 auto', padding:'40px 24px', color:'#f0f2f8', lineHeight:1.7 }}>
      <div style={{ background:'#f59e0b', color:'#000', padding:'10px 16px', borderRadius:8, marginBottom:28, fontWeight:700, fontSize:'.87rem' }}>
        ⚠️ TEMPLATE — This is a template Privacy Policy. Review with a qualified lawyer before publishing this product commercially.
      </div>
      <h1 style={{ fontSize:'1.8rem', fontWeight:900, marginBottom:8 }}>Privacy Policy</h1>
      <p style={{ color:'rgba(255,255,255,.4)', fontSize:'.85rem', marginBottom:32 }}>Last updated: {new Date().toLocaleDateString('en-GB', { year:'numeric', month:'long', day:'numeric' })}</p>

      {[
        ['1. Data We Collect', 'We collect your name, email address, and fitness data you voluntarily enter (workouts, goals, meals, body measurements, water intake). We do not sell or share your data with third parties.'],
        ['2. How We Use Your Data', 'Your data is used exclusively to provide the FitPulse service: tracking fitness, showing progress charts, and sending password-reset emails if requested.'],
        ['3. Data Storage', 'Data is stored on a local MySQL database. In production, it is stored on a secured cloud database. Passwords are hashed with bcrypt and never stored as plain text.'],
        ['4. Cookies and Local Storage', 'We use browser localStorage to store your authentication token. No tracking cookies are used.'],
        ['5. Data Retention', 'Your data is retained until you delete your account. Deleting your account permanently removes all your data.'],
        ['6. Your Rights', 'You may access, export (CSV), or delete your data at any time from your Profile page.'],
        ['7. Contact', 'For privacy enquiries, contact us at privacy@fitpulse.app (placeholder — update before going live).'],
      ].map(([title, body]) => (
        <div key={title} style={{ marginBottom:28 }}>
          <h2 style={{ fontSize:'1rem', fontWeight:800, marginBottom:8, color:'#22c55e' }}>{title}</h2>
          <p style={{ color:'rgba(255,255,255,.65)', fontSize:'.9rem' }}>{body}</p>
        </div>
      ))}
    </div>
  );
}
