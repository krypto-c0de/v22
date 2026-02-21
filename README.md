# TextAnalyzer

Análise psicológica de conversas via IA.

## Estrutura

```
textanalyzer/
├── landing/          → Site estático (textanalyzer.com)
│   └── index.html
├── app/              → React + Vite (textanalyzer.com/app)
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── components/
│   │       ├── AuthScreen.jsx
│   │       ├── Paywall.jsx
│   │       └── ShareCard.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── api/              → Vercel Serverless Functions
│   ├── analyze.js    → Proxy para Anthropic (análise de texto)
│   └── extract.js    → Proxy para Anthropic (leitura de imagem)
├── vercel.json       → Configuração de rotas Vercel
└── README.md
```

## Deploy no Vercel

### 1. Pré-requisitos
- Conta no [Vercel](https://vercel.com)
- Repositório no GitHub com este projeto
- Chave de API da Anthropic

### 2. Conectar repositório
1. Acesse vercel.com → **Add New Project**
2. Importe o repositório do GitHub
3. Vercel detecta o `vercel.json` automaticamente

### 3. Configurar variável de ambiente
No painel do Vercel → **Settings → Environment Variables**:

| Nome | Valor |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |

> ⚠️ **A chave nunca fica exposta no frontend.** Apenas as Serverless Functions em `/api` têm acesso a ela.

### 4. Build e deploy
```bash
# O Vercel executa automaticamente ao fazer push:
cd app && npm install && npm run build
```

### 5. Desenvolvimento local
```bash
# Instalar Vercel CLI
npm i -g vercel

# Na raiz do projeto
vercel dev
# Landing:  http://localhost:3000
# App:      http://localhost:3000/app
# API:      http://localhost:3000/api/analyze
```

## Rotas

| URL | Destino |
|-----|---------|
| `textanalyzer.com` | `landing/index.html` |
| `textanalyzer.com/app` | `app/dist/index.html` (React SPA) |
| `textanalyzer.com/api/analyze` | `api/analyze.js` (Serverless) |
| `textanalyzer.com/api/extract` | `api/extract.js` (Serverless) |

## Funcionalidades

- ✅ Login / Cadastro com email+senha
- ✅ Continuar com Google (mock — integrar Supabase para produção)
- ✅ 10 análises grátis por usuário
- ✅ Pill de uso em tempo real (verde → amarelo → vermelho)
- ✅ Banner de aviso quando restam ≤ 3 análises
- ✅ Paywall elegante com 2 planos (R$12,9/mês · R$22,9/100 análises)
- ✅ Sessão persistente entre recarregamentos
- ✅ Histórico de até 20 análises por usuário
- ✅ Logout pelo avatar no topo
- ✅ Upload de print (WhatsApp, Instagram, Tinder...)
- ✅ Card para TikTok / Reels gerado via Canvas
- ✅ Chave de API protegida no servidor (nunca exposta)
