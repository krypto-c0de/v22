export default function Paywall({ onClose, usadas, FREE_LIMIT }) {
  const PLANS = [
    {
      id: 'mensal',
      label: 'Mensal',
      price: 'R$12,9',
      period: '/mês',
      desc: 'Análises ilimitadas',
      highlight: false,
    },
    {
      id: 'pacote',
      label: 'Pacote',
      price: 'R$22,9',
      period: '/100 análises',
      desc: 'Sem prazo de expiração',
      highlight: true,
    },
  ]

  const benefits = [
    'Análises ilimitadas (ou 100 no pacote)',
    'Histórico completo de conversas',
    'Card para TikTok / Reels',
    'Prioridade na fila de análise',
  ]

  return (
    <div className="paywall-overlay">
      <div className="paywall-box fade-in">
        <div style={{ fontSize: 36, marginBottom: 16 }}>✦</div>

        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, letterSpacing: '.2em', color: '#e8c96d', textTransform: 'uppercase', marginBottom: 12 }}>
          Limite atingido
        </div>

        <h2 style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 28, fontWeight: 400, color: '#e8e4dc', lineHeight: 1.2, marginBottom: 12 }}>
          Você usou suas<br />
          <em style={{ fontStyle: 'italic', color: '#e8c96d' }}>{FREE_LIMIT} análises grátis</em>
        </h2>

        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: 'rgba(232,228,220,.5)', lineHeight: 1.6, marginBottom: 24 }}>
          Continue decodificando conversas sem limite. Cancele quando quiser.
        </p>

        {/* Planos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              style={{
                background: plan.highlight ? 'rgba(232,201,109,.08)' : 'rgba(255,255,255,.03)',
                border: `1px solid ${plan.highlight ? 'rgba(232,201,109,.35)' : 'rgba(255,255,255,.09)'}`,
                borderRadius: 4,
                padding: '16px 14px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all .2s',
                position: 'relative',
              }}
            >
              {plan.highlight && (
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#e8c96d', color: '#0a0a0a', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', padding: '2px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                  MAIS POPULAR
                </div>
              )}
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(232,228,220,.4)', marginBottom: 4 }}>{plan.label}</div>
              <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 26, color: '#e8c96d', lineHeight: 1 }}>{plan.price}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(232,228,220,.35)' }}>{plan.period}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'rgba(232,228,220,.5)', marginTop: 6 }}>{plan.desc}</div>
            </div>
          ))}
        </div>

        {/* Benefícios */}
        <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 4, padding: '16px', marginBottom: 20, textAlign: 'left' }}>
          {benefits.map(b => (
            <div key={b} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#00ff87', fontSize: 12, flexShrink: 0 }}>✦</span>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(232,228,220,.65)' }}>{b}</span>
            </div>
          ))}
        </div>

        <button className="btn-pro">Assinar agora →</button>
        <button className="btn-outline" onClick={onClose} style={{ width: '100%', marginTop: 10 }}>Voltar</button>

        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(232,228,220,.2)', marginTop: 14 }}>
          Pagamento seguro · Cancele a qualquer momento
        </p>
      </div>
    </div>
  )
}
