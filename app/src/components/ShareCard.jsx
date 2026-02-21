import { useState, useEffect, useRef } from 'react'

const scoreColor = s => s >= 70 ? '#00ff87' : s >= 40 ? '#ffd700' : '#ff4757'
const SC = {
  green:  { border: '#00ff87', icon: '✦' },
  red:    { border: '#ff4757', icon: '✗' },
  hidden: { border: '#b464ff', icon: '◈' },
}

function wrapCtx(ctx, text, x, y, maxW, lineH, maxLines = 99) {
  const words = text.split(' ')
  let line = '', cy = y, lines = 0
  for (let i = 0; i < words.length; i++) {
    const t = line + words[i] + ' '
    if (ctx.measureText(t).width > maxW && i > 0) {
      ctx.fillText(line, x, cy)
      line = words[i] + ' '
      cy += lineH
      lines++
      if (lines >= maxLines) { ctx.fillText(line + '...', x, cy); return cy }
    } else {
      line = t
    }
  }
  ctx.fillText(line, x, cy)
  return cy
}

function roundR(ctx, x, y, w, h, r, fill = true, stroke = false) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  if (fill) ctx.fill()
  if (stroke) ctx.stroke()
}

export default function ShareCard({ resultado, onClose }) {
  const canvasRef = useRef()
  const [url, setUrl] = useState(null)

  useEffect(() => { setTimeout(draw, 80) }, [])

  function draw() {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const W = 720, H = 1260
    c.width = W; c.height = H

    // Background
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, W, H)

    // Gradient orbs
    const g1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 500)
    g1.addColorStop(0, 'rgba(232,201,109,.13)'); g1.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H)

    const g2 = ctx.createRadialGradient(W, H, 0, W, H, 450)
    g2.addColorStop(0, 'rgba(180,100,255,.1)'); g2.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H)

    // Grain
    for (let i = 0; i < 7000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * .03})`
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
    }

    // Header
    ctx.font = '600 22px Arial'; ctx.fillStyle = 'rgba(232,228,220,.3)'; ctx.fillText('◈  TEXTANALYZER', 60, 80)
    ctx.fillStyle = '#e8c96d'; ctx.fillRect(60, 96, 90, 3)

    // Frase final
    ctx.font = 'italic 33px Georgia'; ctx.fillStyle = '#e8e4dc'
    let y = wrapCtx(ctx, `"${resultado.frase_final}"`, 60, 155, W - 120, 48)
    const divY = Math.max(y + 44, 290)
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(60, divY, W - 120, 1)

    // Perfil
    ctx.font = 'bold 42px Georgia'; ctx.fillStyle = '#e8e4dc'; ctx.fillText(resultado.perfil.nome, 60, divY + 54)
    ctx.font = '500 22px Arial'; ctx.fillStyle = '#e8c96d'; ctx.fillText(resultado.perfil.arquetipo, 60, divY + 88)

    // Score
    const sc = resultado.dinamica.score_interesse
    ctx.font = 'bold 84px Arial'; ctx.fillStyle = scoreColor(sc); ctx.fillText(`${sc}%`, 60, divY + 200)
    ctx.font = '400 20px Arial'; ctx.fillStyle = 'rgba(232,228,220,.35)'; ctx.fillText('de interesse', 60, divY + 232)
    ctx.fillStyle = 'rgba(255,255,255,.07)'; roundR(ctx, 60, divY + 248, W - 120, 10, 5)
    ctx.fillStyle = scoreColor(sc); roundR(ctx, 60, divY + 248, (W - 120) * sc / 100, 10, 5)

    // Poder
    ctx.font = '500 24px Arial'; ctx.fillStyle = '#e8e4dc'; ctx.fillText(`Poder: ${resultado.dinamica.score_poder}`, 60, divY + 294)
    ctx.font = '400 20px Arial'; ctx.fillStyle = 'rgba(232,228,220,.4)'; ctx.fillText(resultado.dinamica.tipo_vinculo, 60, divY + 326)
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(60, divY + 352, W - 120, 1)

    // Sinais
    let sy = divY + 398
    ;(resultado.sinais || []).slice(0, 3).forEach(s => {
      const col = SC[s.tipo] || SC.hidden
      ctx.font = '500 19px Arial'; ctx.fillStyle = col.border; ctx.fillText(col.icon, 60, sy)
      ctx.font = '400 19px Arial'; ctx.fillStyle = 'rgba(232,228,220,.72)'
      wrapCtx(ctx, s.texto, 92, sy, W - 150, 26, 1)
      sy += 54
    })

    // Próximo passo
    const bY = sy + 18
    ctx.fillStyle = 'rgba(232,201,109,.07)'; roundR(ctx, 60, bY, W - 120, 120, 3)
    ctx.strokeStyle = 'rgba(232,201,109,.2)'; ctx.lineWidth = 1; roundR(ctx, 60, bY, W - 120, 120, 3, false, true)
    ctx.font = '500 18px Arial'; ctx.fillStyle = 'rgba(232,201,109,.55)'; ctx.fillText('O QUE FAZER AGORA', 80, bY + 32)
    ctx.font = '400 19px Arial'; ctx.fillStyle = '#e8e4dc'
    wrapCtx(ctx, resultado.proximo_passo.recomendacao, 80, bY + 62, W - 160, 26, 2)

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(60, H - 60, W - 120, 1)
    ctx.font = '400 18px Arial'; ctx.fillStyle = 'rgba(232,228,220,.2)'; ctx.fillText('textanalyzer.com', 60, H - 28)
    ctx.fillStyle = 'rgba(232,228,220,.2)'; ctx.textAlign = 'right'; ctx.fillText(new Date().toLocaleDateString('pt-BR'), W - 60, H - 28)
    ctx.textAlign = 'left'

    setUrl(c.toDataURL('image/png'))
  }

  function baixar() {
    const a = document.createElement('a')
    a.href = url
    a.download = `analise-${resultado.perfil.nome.replace(/\s/g, '-')}.png`
    a.click()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '24px 16px', gap: 16, overflowY: 'auto' }}>
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, letterSpacing: '.2em', color: 'rgba(232,228,220,.35)', textTransform: 'uppercase' }}>
        Card para TikTok / Reels
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {url && <img src={url} alt="card" style={{ maxWidth: 340, width: '100%', border: '1px solid rgba(255,255,255,.08)' }} />}
      {!url && <div className="pulse" style={{ fontSize: 32, marginTop: 40 }}>◈</div>}
      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
        <button className="btn-gold" onClick={baixar} disabled={!url} style={{ flex: 2 }}>⬇ Baixar PNG</button>
        <button className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Fechar</button>
      </div>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(232,228,220,.2)', textAlign: 'center' }}>
        Salve e poste no TikTok com #TextAnalyzer ✦
      </p>
    </div>
  )
}
