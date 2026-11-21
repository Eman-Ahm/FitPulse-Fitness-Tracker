export default function TermsPage() {
  return (
    <div style={{ maxWidth:720, margin:'0 auto', padding:'40px 24px', color:'#f0f2f8', lineHeight:1.7 }}>
      <div style={{ background:'#f59e0b', color:'#000', padding:'10px 16px', borderRadius:8, marginBottom:28, fontWeight:700, fontSize:'.87rem' }}>
        ⚠️ TEMPLATE — This is a template Terms of Service. Review with a qualified lawyer before publishing this product commercially.
      </div>
      <h1 style={{ fontSize:'1.8rem', fontWeight:900, marginBottom:8 }}>Terms of Service</h1>
      <p style={{ color:'rgba(255,255,255,.4)', fontSize:'.85rem', marginBottom:32 }}>Last updated: {new Date().toLocaleDateString('en-GB', { year:'numeric', month:'long', day:'numeric' })}</p>

      {[
        ['1. Acceptance', 'By using FitPulse you agree to these terms. If you do not agree, do not use the service.'],
        ['2. Description of Service', 'FitPulse is a personal fitness tracking application. It is provided for personal, non-commercial use.'],
        ['3. User Accounts', 'You are responsible for keeping your login credentials secure. You must be at least 13 years old to use this service.'],
        ['4. User Content', 'You own your fitness data. You grant FitPulse a limited licence to store and display it to you.'],
        ['5. Prohibited Uses', 'You may not use FitPulse to store illegal content, attempt to breach security, or violate another person\'s privacy.'],
        ['6. Disclaimer', 'FitPulse provides fitness tracking, not medical advice. Consult a healthcare professional before starting any fitness programme.'],
        ['7. Limitation of Liability', 'FitPulse is provided "as is" without warranties of any kind. We are not liable for any damages arising from use of the service.'],
        ['8. Termination', 'You may delete your account at any time. We reserve the right to terminate accounts that violate these terms.'],
        ['9. Changes', 'We may update these terms. Continued use after changes constitutes acceptance.'],
        ['10. Contact', 'legal@fitpulse.app (placeholder — update before going live).'],
      ].map(([title, body]) => (
        <div key={title} style={{ marginBottom:28 }}>
          <h2 style={{ fontSize:'1rem', fontWeight:800, marginBottom:8, color:'#22c55e' }}>{title}</h2>
          <p style={{ color:'rgba(255,255,255,.65)', fontSize:'.9rem' }}>{body}</p>
        </div>
      ))}
    </div>
  );
}
