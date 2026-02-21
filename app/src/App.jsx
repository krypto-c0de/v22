import { useState, useEffect, useRef } from 'react'
import AuthScreen from './components/AuthScreen.jsx'
import Paywall    from './components/Paywall.jsx'
import ShareCard  from './components/ShareCard.jsx'

// ─── Constantes ───────────────────────────────────────────────────────────────
const FREE_LIMIT = 10

const SYSTEM_PROMPT = `Você é um psicólogo especialista em comunicação, linguagem não-verbal textual e dinâmicas de relacionamento. Analise a conversa fornecida com profundidade e retorne APENAS um JSON válido (sem markdown, sem backticks) com exatamente esta estrutura:
{"perfil":{"nome":"nome ou apelido identificado, ou 'Pessoa A'","arquetipo":"ex: O Evitativo, A Controladora, O Ansioso, etc.","resumo":"2 frases diretas sobre quem essa pessoa é nessa conversa"},"dinamica":{"score_interesse":0,"score_poder":"'você', 'ela/ele' ou 'equilibrado'","tipo_vinculo":"ex: Atração com medo de intimidade","resumo":"2 frases sobre a dinâmica"},"sinais":[{"tipo":"green","texto":"sinal positivo"},{"tipo":"red","texto":"sinal de alerta"},{"tipo":"hidden","texto":"algo nas entrelinhas"}],"proximo_passo":{"recomendacao":"o que fazer agora em 1 frase direta","mensagem_sugerida":"mensagem exata ou null","aviso":"o risco principal"},"frase_final":"frase impactante e honesta que resume tudo"}
Seja direto, honesto e um pouco brutal. Não suavize a realidade.`

const EXTRACT_PROMPT = `Extraia o texto completo desta conversa de print de tela, mantendo o formato de quem disse o quê. Retorne APENAS o texto da conversa, sem explicações. Se não conseguir identificar, retorne "ERRO: imagem não legível".`

const scoreColor = s => s >= 70 ? '#00ff87' : s >= 40 ? '#ffd700' : '#ff4757'
const SC = {
  green:  { bg: 'rgba(0,255,135,0.08)',   border: '#00ff87', icon: '✦' },
  red:    { bg: 'rgba(255,71,87,0.08)',   border: '#ff4757', icon: '✗' },
  hidden: { bg: 'rgba(180,100,255,0.08)', border: '#b464ff', icon: '◈' },
}

const LOADING_MSGS = [
  'Lendo nas entrelinhas...',
  'Analisando padrões emocionais...',
  'Identificando o que não foi dito...',
  'Calculando dinâmicas de poder...',
  'Preparando a verdade...',
]

// ─── Helpers de storage ───────────────────────────────────────────────────────
async function storageGet(key) {
  try { const r = await window.storage.get(key); return r?.value ? JSON.parse(r.value) : null }
  catch { return null }
}
async function storageSet(key, value) {
  try { await window.storage.set(key, JSON.stringify(value)) } catch { /* silencioso */ }
}
async function storageDel(key) {
  try { await window.storage.delete(key) } catch { /* silencioso */ }
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  // Auth
  const [user, setUser]               = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Análise
  const [conversa, setConversa]       = useState('')
  const [contexto, setContexto]       = useState('')
  const [resultado, setResultado]     = useState(null)
  const [loading, setLoading]         = useState(false)
  const [erro, setErro]               = useState(null)
  const [etapa, setEtapa]             = useState('input') // 'input' | 'loading' | 'resultado'
  const [loadingMsg, setLoadingMsg]   = useState(0)

  // Input
  const [inputMode, setInputMode]     = useState('texto') // 'texto' | 'print'
  const [imgB64, setImgB64]           = useState(null)
  const [imgPreview, setImgPreview]   = useState(null)
  const [extraindo, setExtraindo]     = useState(false)
  const [dragOver, setDragOver]       = useState(false)
  const fileRef = useRef()

  // UI
  const [showShare, setShowShare]     = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [aba, setAba]                 = useState('nova') // 'nova' | 'historico'
  const [historico, setHistorico]     = useState([])

  // ── Verificar sessão ao montar ──────────────────────────────────────────────
  useEffect(() => {
    async function checkSession() {
      const saved = await storageGet('ta_session')
      if (saved) {
        setUser(saved)
        const hist = await storageGet(`hist_${saved.email}`)
        if (hist) setHistorico(hist)
      }
      setAuthChecked(true)
    }
    checkSession()
  }, [])

  // ── Ciclo de mensagens durante loading ─────────────────────────────────────
  useEffect(() => {
    if (!loading) return
    const iv = setInterval(() => setLoadingMsg(p => (p + 1) % LOADING_MSGS.length), 1800)
    return () => clearInterval(iv)
  }, [loading])

  // ── Auth handlers ───────────────────────────────────────────────────────────
  async function onAuth(u) {
    setUser(u)
    await storageSet('ta_session', u)
    const hist = await storageGet(`hist_${u.email}`)
    if (hist) setHistorico(hist)
  }

  async function logout() {
    await storageDel('ta_session')
    setUser(null)
    setHistorico([])
    resetar()
  }

  async function atualizarUser(updates) {
    const novo = { ...user, ...updates }
    setUser(novo)
    await storageSet('ta_session', novo)
    await storageSet(`user_${novo.email}`, novo)
  }

  async function salvarHistorico(item) {
    const novo = [item, ...historico].slice(0, 20)
    setHistorico(novo)
    await storageSet(`hist_${user.email}`, novo)
  }

  // ── File handling ───────────────────────────────────────────────────────────
  function handleFile(file) {
    if (!file?.type.startsWith('image/')) { setErro('Envie uma imagem (PNG, JPG, WEBP).'); return }
    setErro(null)
    const reader = new FileReader()
    reader.onload = e => {
      setImgPreview(e.target.result)
      setImgB64({ data: e.target.result.split(',')[1], mediaType: file.type })
    }
    reader.readAsDataURL(file)
  }

  // ── Extrair texto do print ──────────────────────────────────────────────────
  async function extrair() {
    if (!imgB64) return
    setExtraindo(true); setErro(null)
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imgB64 }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Erro desconhecido')
      if (d.text.startsWith('ERRO:')) {
        setErro('Não consegui ler a imagem. Tente com melhor resolução.')
      } else {
        setConversa(d.text)
        setInputMode('texto')
        setImgPreview(null)
        setImgB64(null)
      }
    } catch (e) {
      setErro('Erro ao processar imagem. Tente novamente.')
    } finally {
      setExtraindo(false)
    }
  }

  // ── Analisar conversa ───────────────────────────────────────────────────────
  async function analisar() {
    if (!conversa.trim() || conversa.length < 30) { setErro('Conversa muito curta.'); return }
    const usadas = user.analises_usadas || 0
    if (user.plano !== 'pro' && usadas >= FREE_LIMIT) { setShowPaywall(true); return }

    setErro(null); setLoading(true); setEtapa('loading')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversa, contexto }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Erro desconhecido')

      setResultado(d.resultado)
      setEtapa('resultado')
      await atualizarUser({ analises_usadas: usadas + 1 })
      await salvarHistorico({
        id: Date.now().toString(),
        data: new Date().toLocaleDateString('pt-BR'),
        contexto,
        resultado: d.resultado,
      })
    } catch (e) {
      setErro('Erro ao analisar. Tente novamente.')
      setEtapa('input')
    } finally {
      setLoading(false)
    }
  }

  function resetar() {
    setResultado(null); setConversa(''); setContexto('')
    setEtapa('input'); setErro(null)
    setImgB64(null); setImgPreview(null); setInputMode('texto')
  }

  // ── Derivados ───────────────────────────────────────────────────────────────
  const analises_usadas = user?.analises_usadas || 0
  const restantes = Math.max(0, FREE_LIMIT - analises_usadas)
  const isPro = user?.plano === 'pro'

  // ── Aguarda verificação de sessão ───────────────────────────────────────────
  if (!authChecked) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 32 }} className="pulse">◈</div>
    </div>
  )

  if (!user) return <AuthScreen onAuth={onAuth} />

  // ── Render principal ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e4dc', fontFamily: "'DM Serif Display', Georgia, serif", position: 'relative', overflow: 'hidden' }}>
      <div className="grain" />
      <div className="glow" style={{ width: 500, height: 500, top: -100, left: -150, background: 'rgba(232,201,109,.04)' }} />
      <div className="glow" style={{ width: 400, height: 400, bottom: -100, right: -100, background: 'rgba(180,100,255,.03)' }} />

      {showShare && resultado && <ShareCard resultado={resultado} onClose={() => setShowShare(false)} />}
      {showPaywall && <Paywall usadas={analises_usadas} FREE_LIMIT={FREE_LIMIT} onClose={() => setShowPaywall(false)} />}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* ── Top bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 22, letterSpacing: '-.02em' }}>
            Text<em style={{ fontStyle: 'italic', color: '#e8c96d' }}>Analyzer</em>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

            {/* Pill de uso — verde / amarelo / vermelho */}
            {!isPro && (
              <div
                className="usage-pill"
                onClick={() => setShowPaywall(true)}
                title="Ver plano Pro"
              >
                <div className="usage-dot" style={{ background: restantes > 3 ? '#00ff87' : restantes > 0 ? '#ffd700' : '#ff4757' }} />
                {restantes > 0 ? `${restantes} restantes` : 'Limite atingido'}
              </div>
            )}
            {isPro && (
              <div className="usage-pill" style={{ cursor: 'default' }}>
                <span style={{ color: '#e8c96d', fontSize: 10 }}>✦</span>
                <span style={{ color: '#e8c96d' }}>Pro</span>
              </div>
            )}

            {/* Avatar / logout */}
            <button
              onClick={logout}
              title="Sair da conta"
              style={{
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.08)',
                borderRadius: '50%',
                width: 34, height: 34,
                cursor: 'pointer',
                color: '#e8e4dc',
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {(user.nome || user.email)[0].toUpperCase()}
            </button>
          </div>
        </div>

        {/* ── Saudação ── */}
        {etapa === 'input' && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(232,228,220,.35)' }}>
              Olá, <span style={{ color: 'rgba(232,228,220,.7)' }}>{user.nome || user.email.split('@')[0]}</span>
            </p>
            <h1 style={{ fontSize: 'clamp(28px,6vw,42px)', lineHeight: 1.1, fontWeight: 400, letterSpacing: '-.02em', marginTop: 4 }}>
              O que a conversa<br />
              <em style={{ fontStyle: 'italic', color: '#e8c96d' }}>realmente diz?</em>
            </h1>
          </div>
        )}

        {/* ── Abas ── */}
        {etapa === 'input' && (
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 24 }}>
            <button className={`tab ${aba === 'nova' ? 'active' : ''}`} onClick={() => setAba('nova')}>Nova análise</button>
            <button className={`tab ${aba === 'historico' ? 'active' : ''}`} onClick={() => setAba('historico')}>
              Histórico
              {historico.length > 0 && (
                <span style={{ marginLeft: 5, background: 'rgba(232,201,109,.15)', color: '#e8c96d', fontSize: 10, padding: '1px 5px', borderRadius: 8 }}>
                  {historico.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* ── ABA: Nova análise ── */}
        {etapa === 'input' && aba === 'nova' && (
          <div className="fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Contexto */}
              <div>
                <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, letterSpacing: '.15em', color: 'rgba(232,228,220,.4)', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Contexto (opcional)</label>
                <input type="text" value={contexto} onChange={e => setContexto(e.target.value)} placeholder="ex: crush de 2 meses, ex que voltou, amigo distante..." />
              </div>

              {/* Sub-tabs texto / print */}
              <div>
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 14 }}>
                  <button className={`tab ${inputMode === 'texto' ? 'active' : ''}`} onClick={() => setInputMode('texto')}>✎ Colar texto</button>
                  <button className={`tab ${inputMode === 'print' ? 'active' : ''}`} onClick={() => setInputMode('print')}>◻ Enviar print</button>
                </div>

                {/* Texto */}
                {inputMode === 'texto' && (
                  <div>
                    <textarea
                      rows={9}
                      value={conversa}
                      onChange={e => setConversa(e.target.value)}
                      placeholder={'Cole aqui a conversa completa...\n\nVocê: oi sumido\nEle: oi! desculpa\nVocê: tá bem?\n...'}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      {conversa.length > 30 && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(0,255,135,.5)' }}>✦ Pronta</span>}
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(232,228,220,.2)', marginLeft: 'auto' }}>{conversa.length} chars</span>
                    </div>
                  </div>
                )}

                {/* Print */}
                {inputMode === 'print' && (
                  <div>
                    {!imgPreview ? (
                      <div
                        className={`drop-zone ${dragOver ? 'over' : ''}`}
                        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
                        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onClick={() => fileRef.current?.click()}
                      >
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
                        <div style={{ fontSize: 36, marginBottom: 14, opacity: .3 }}>⬆</div>
                        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: 'rgba(232,228,220,.5)', marginBottom: 6 }}>Arraste o print ou clique</p>
                        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'rgba(232,228,220,.2)' }}>WhatsApp · Instagram · Tinder · iMessage</p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ border: '1px solid rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 12, position: 'relative' }}>
                          <img src={imgPreview} alt="print" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', background: 'rgba(255,255,255,.02)', display: 'block' }} />
                          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,.75)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 2, padding: '3px 10px', fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(232,228,220,.5)' }}>Print carregado</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button className="btn-dark" onClick={extrair} disabled={extraindo} style={{ flex: 2 }}>
                            {extraindo
                              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span className="spin">◈</span>Lendo...</span>
                              : '◈ Extrair texto →'}
                          </button>
                          <button className="btn-outline" onClick={() => { setImgPreview(null); setImgB64(null); setErro(null) }} disabled={extraindo}>Trocar</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Erro */}
              {erro && (
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#ff4757', padding: '10px 14px', background: 'rgba(255,71,87,.06)', border: '1px solid rgba(255,71,87,.2)', borderRadius: 2 }}>
                  {erro}
                </div>
              )}

              {/* Banner aviso limite próximo */}
              {!isPro && restantes <= 3 && restantes > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,215,0,.05)', border: '1px solid rgba(255,215,0,.15)', borderRadius: 2, padding: '10px 14px' }}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(255,215,0,.8)' }}>
                    ⚠ Apenas {restantes} análise{restantes !== 1 ? 's' : ''} grátis restante{restantes !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setShowPaywall(true)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#e8c96d', textDecoration: 'underline' }}
                  >
                    Ver Pro
                  </button>
                </div>
              )}

              <button className="btn-gold" onClick={analisar} disabled={loading || !conversa.trim() || conversa.length < 30}>
                Analisar conversa →
              </button>

              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(232,228,220,.18)', textAlign: 'center', lineHeight: 1.6 }}>
                Sua conversa não é armazenada. Análise gerada por IA.
              </p>
            </div>
          </div>
        )}

        {/* ── ABA: Histórico ── */}
        {etapa === 'input' && aba === 'historico' && (
          <div className="fade-in">
            {historico.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 14, opacity: .2 }}>◈</div>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: 'rgba(232,228,220,.3)' }}>Nenhuma análise ainda</p>
                <button className="btn-outline" onClick={() => setAba('nova')} style={{ marginTop: 20 }}>Fazer primeira análise →</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(232,228,220,.3)', marginBottom: 4 }}>
                  {historico.length} análise{historico.length !== 1 ? 's' : ''} salva{historico.length !== 1 ? 's' : ''}
                </div>
                {historico.map(item => (
                  <div
                    key={item.id}
                    onClick={() => { setResultado(item.resultado); setContexto(item.contexto || ''); setEtapa('resultado'); setAba('nova') }}
                    style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 2, padding: '14px 16px', cursor: 'pointer', transition: 'background .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.025)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div>
                        <span style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 15, color: '#e8e4dc' }}>{item.resultado.perfil.nome}</span>
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: '#e8c96d', marginLeft: 8 }}>{item.resultado.perfil.arquetipo}</span>
                      </div>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(232,228,220,.25)' }}>{item.data}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: scoreColor(item.resultado.dinamica.score_interesse), fontWeight: 500 }}>{item.resultado.dinamica.score_interesse}%</span>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(232,228,220,.3)' }}>·</span>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(232,228,220,.4)' }}>{item.resultado.dinamica.tipo_vinculo}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Loading ── */}
        {etapa === 'loading' && (
          <div style={{ textAlign: 'center', padding: '80px 0' }} className="fade-in">
            <div style={{ fontSize: 48, marginBottom: 32 }} className="pulse">◈</div>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 16, color: 'rgba(232,228,220,.6)', fontWeight: 300 }} className="pulse">
              {LOADING_MSGS[loadingMsg]}
            </p>
            <div style={{ width: 200, height: 1, background: 'rgba(255,255,255,.06)', margin: '32px auto 0', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', height: '100%', width: '40%', background: '#e8c96d', animation: 'slide 1.5s ease-in-out infinite' }} />
            </div>
          </div>
        )}

        {/* ── Resultado ── */}
        {etapa === 'resultado' && resultado && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <button className="btn-share" onClick={() => setShowShare(true)}>↗ Gerar card para TikTok / Reels</button>

            {/* Frase final */}
            <div style={{ borderLeft: '3px solid #e8c96d', paddingLeft: 20, marginBottom: 4 }}>
              <p style={{ fontSize: 'clamp(18px,4vw,22px)', lineHeight: 1.4, fontStyle: 'italic' }}>"{resultado.frase_final}"</p>
            </div>

            {/* Perfil */}
            <div className="card">
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, letterSpacing: '.2em', color: 'rgba(232,228,220,.3)', textTransform: 'uppercase', marginBottom: 12 }}>Perfil</div>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{resultado.perfil.nome}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#e8c96d', letterSpacing: '.1em' }}>{resultado.perfil.arquetipo}</div>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: 'rgba(232,228,220,.6)', marginTop: 12, lineHeight: 1.6, fontWeight: 300 }}>{resultado.perfil.resumo}</p>
            </div>

            {/* Dinâmica */}
            <div className="card">
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, letterSpacing: '.2em', color: 'rgba(232,228,220,.3)', textTransform: 'uppercase', marginBottom: 16 }}>Dinâmica</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(232,228,220,.35)', marginBottom: 6 }}>Interesse</div>
                  <div style={{ fontSize: 28, color: scoreColor(resultado.dinamica.score_interesse) }}>
                    {resultado.dinamica.score_interesse}<span style={{ fontSize: 14 }}>%</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${resultado.dinamica.score_interesse}%`, background: scoreColor(resultado.dinamica.score_interesse) }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(232,228,220,.35)', marginBottom: 6 }}>Poder</div>
                  <div style={{ fontSize: 16, marginTop: 6 }}>{resultado.dinamica.score_poder}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'rgba(232,228,220,.4)', marginTop: 4 }}>{resultado.dinamica.tipo_vinculo}</div>
                </div>
              </div>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: 'rgba(232,228,220,.6)', lineHeight: 1.6, fontWeight: 300 }}>{resultado.dinamica.resumo}</p>
            </div>

            {/* Sinais */}
            <div className="card">
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, letterSpacing: '.2em', color: 'rgba(232,228,220,.3)', textTransform: 'uppercase', marginBottom: 16 }}>Sinais</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {resultado.sinais?.map((s, i) => {
                  const c = SC[s.tipo] || SC.hidden
                  return (
                    <div key={i} style={{ background: c.bg, borderLeft: `2px solid ${c.border}`, borderRadius: 2, padding: '10px 14px', display: 'flex', gap: 10 }}>
                      <span style={{ color: c.border, fontSize: 14, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(232,228,220,.75)', lineHeight: 1.5 }}>{s.texto}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Próximo passo */}
            <div style={{ background: 'rgba(232,201,109,.06)', border: '1px solid rgba(232,201,109,.15)', borderRadius: 2, padding: 24 }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, letterSpacing: '.2em', color: 'rgba(232,201,109,.5)', textTransform: 'uppercase', marginBottom: 16 }}>O que fazer agora</div>
              <p style={{ fontSize: 18, lineHeight: 1.4, marginBottom: 16 }}>{resultado.proximo_passo.recomendacao}</p>
              {resultado.proximo_passo.mensagem_sugerida && (
                <div style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 2, padding: '12px 16px', marginBottom: 16 }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, letterSpacing: '.15em', color: 'rgba(232,228,220,.3)', textTransform: 'uppercase', marginBottom: 8 }}>Mensagem sugerida</div>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: 'rgba(232,228,220,.8)', lineHeight: 1.6, fontStyle: 'italic' }}>"{resultado.proximo_passo.mensagem_sugerida}"</p>
                </div>
              )}
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'rgba(255,71,87,.7)', lineHeight: 1.5 }}>⚠ {resultado.proximo_passo.aviso}</p>
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-outline" onClick={resetar} style={{ flex: 1 }}>← Nova análise</button>
              <button className="btn-outline" onClick={() => { setEtapa('input'); setAba('historico') }} style={{ flex: 1 }}>Histórico</button>
            </div>

            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(232,228,220,.15)', textAlign: 'center' }}>
              Análise gerada por IA. Use como reflexão — não como verdade absoluta.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
