// api/analyze.js — Vercel Serverless Function
// A chave da Anthropic fica APENAS no servidor (variável de ambiente Vercel).
// O frontend nunca tem acesso a ela.

const SYSTEM_PROMPT = `Você é um psicólogo especialista em comunicação, linguagem não-verbal textual e dinâmicas de relacionamento. Analise a conversa fornecida com profundidade e retorne APENAS um JSON válido (sem markdown, sem backticks) com exatamente esta estrutura:
{"perfil":{"nome":"nome ou apelido identificado, ou 'Pessoa A'","arquetipo":"ex: O Evitativo, A Controladora, O Ansioso, etc.","resumo":"2 frases diretas sobre quem essa pessoa é nessa conversa"},"dinamica":{"score_interesse":0,"score_poder":"'você', 'ela/ele' ou 'equilibrado'","tipo_vinculo":"ex: Atração com medo de intimidade","resumo":"2 frases sobre a dinâmica"},"sinais":[{"tipo":"green","texto":"sinal positivo"},{"tipo":"red","texto":"sinal de alerta"},{"tipo":"hidden","texto":"algo nas entrelinhas"}],"proximo_passo":{"recomendacao":"o que fazer agora em 1 frase direta","mensagem_sugerida":"mensagem exata ou null","aviso":"o risco principal"},"frase_final":"frase impactante e honesta que resume tudo"}
Seja direto, honesto e um pouco brutal. Não suavize a realidade.`

export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { conversa, contexto } = req.body

  if (!conversa || conversa.trim().length < 30) {
    return res.status(400).json({ error: 'Conversa muito curta.' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,   // ← variável de ambiente Vercel
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Contexto: ${contexto || 'Nenhum'}\n\nConversa:\n${conversa}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic error:', err)
      return res.status(502).json({ error: 'Erro na API de IA. Tente novamente.' })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    let resultado
    try {
      resultado = JSON.parse(text)
    } catch {
      return res.status(502).json({ error: 'Resposta inválida da IA. Tente novamente.' })
    }

    return res.status(200).json({ resultado })
  } catch (error) {
    console.error('Handler error:', error)
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' })
  }
}
