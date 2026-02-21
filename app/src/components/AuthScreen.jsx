import { useState } from 'react'

export default function AuthScreen({ onAuth }) {
  const [modo, setModo]   = useState('login') // 'login' | 'signup'
  const [nome, setNome]   = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setErro('')
    if (!email.trim() || !senha.trim()) { setErro('Preencha email e senha.'); return }
    if (modo === 'signup' && !nome.trim()) { setErro('Digite seu nome.'); return }
    if (senha.length < 6) { setErro('Senha deve ter no mínimo 6 caracteres.'); return }
    setLoading(true)
    try {
      const key = `user_${email.toLowerCase().trim()}`
      if (modo === 'signup') {
        try {
          await window.storage.get(key)
          setErro('Email já cadastrado. Faça login.')
          setLoading(false)
          return
        } catch (e) { /* não existe — pode criar */ }
        const user = {
          nome: nome.trim(),
          email: email.toLowerCase().trim(),
          senha,
          analises_usadas: 0,
          plano: 'free',
          criado: new Date().toISOString(),
        }
        await window.storage.set(key, JSON.stringify(user))
        onAuth(user)
      } else {
        let userData
        try {
          const res = await window.storage.get(key)
          userData = JSON.parse(res.value)
        } catch (e) {
          setErro('Email não encontrado. Crie uma conta.')
          setLoading(false)
          return
        }
        if (userData.senha !== senha) { setErro('Senha incorreta.'); setLoading(false); return }
        onAuth(userData)
      }
    } catch (e) {
      setErro('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleGoogle() {
    // Mock — em produção substituir por Supabase / Firebase OAuth
    const mockUser = {
      nome: 'Usuário Google',
      email: `google_${Date.now()}@mock.com`,
      analises_usadas: 0,
      plano: 'free',
    }
    onAuth(mockUser)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div className="grain" />
      <div className="glow" style={{ width: 500, height: 500, top: -150, left: -150, background: 'rgba(232,201,109,.05)' }} />
      <div className="glow" style={{ width: 400, height: 400, bottom: -100, right: -100, background: 'rgba(180,100,255,.04)' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }} className="fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 40, fontWeight: 400, letterSpacing: '-.02em', color: '#e8e4dc' }}>
            Text<em style={{ fontStyle: 'italic', color: '#e8c96d' }}>Analyzer</em>
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(232,228,220,.4)', marginTop: 8 }}>
            {modo === 'login' ? 'Entre para continuar' : 'Crie sua conta grátis'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 24 }}>
          <button className={`tab ${modo === 'login' ? 'active' : ''}`} onClick={() => { setModo('login'); setErro('') }}>Entrar</button>
          <button className={`tab ${modo === 'signup' ? 'active' : ''}`} onClick={() => { setModo('signup'); setErro('') }}>Criar conta</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Google */}
          <button className="btn-social" onClick={handleGoogle}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continuar com Google
          </button>

          <div className="social-divider"><span>ou com email</span></div>

          {modo === 'signup' && (
            <div>
              <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, letterSpacing: '.15em', color: 'rgba(232,228,220,.4)', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Nome</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
            </div>
          )}

          <div>
            <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, letterSpacing: '.15em', color: 'rgba(232,228,220,.4)', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          <div>
            <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, letterSpacing: '.15em', color: 'rgba(232,228,220,.4)', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Senha</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder={modo === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          {erro && (
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#ff4757', padding: '10px 14px', background: 'rgba(255,71,87,.06)', border: '1px solid rgba(255,71,87,.2)', borderRadius: 2 }}>{erro}</div>
          )}

          <button className="btn-gold" onClick={handleSubmit} disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <span className="spin">◈</span> : modo === 'login' ? 'Entrar →' : 'Criar conta grátis →'}
          </button>

          {/* Badge freemium — só no signup */}
          {modo === 'signup' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,255,135,.06)', border: '1px solid rgba(0,255,135,.15)', borderRadius: 999, padding: '5px 14px' }}>
                <span style={{ color: '#00ff87', fontSize: 12 }}>✦</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'rgba(0,255,135,.7)' }}>10 análises grátis incluídas</span>
              </div>
            </div>
          )}

          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(232,228,220,.2)', textAlign: 'center', lineHeight: 1.6 }}>
            Suas conversas nunca são armazenadas nos servidores.
          </p>
        </div>
      </div>
    </div>
  )
}
