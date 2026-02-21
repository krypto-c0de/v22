// api/extract.js — Vercel Serverless Function
// Recebe uma imagem em base64 e extrai o texto da conversa via Claude Vision.

const EXTRACT_PROMPT = `Extraia o texto completo desta conversa de print de tela, mantendo o formato de quem disse o quê. Retorne APENAS o texto da conversa, sem explicações. Se não conseguir identificar, retorne "ERRO: imagem não legível".`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { image } = req.body // { data: string (base64), mediaType: string }

  if (!image?.data || !image?.mediaType) {
    return res.status(400).json({ error: 'Imagem inválida.' })
  }

  // Validar tipo de imagem
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(image.mediaType)) {
    return res.status(400).json({ error: 'Tipo de imagem não suportado.' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: image.mediaType,
                  data: image.data,
                },
              },
              { type: 'text', text: EXTRACT_PROMPT },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic error:', err)
      return res.status(502).json({ error: 'Erro ao processar imagem.' })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || 'ERRO: resposta vazia'

    return res.status(200).json({ text })
  } catch (error) {
    console.error('Handler error:', error)
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' })
  }
}
