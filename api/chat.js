// Vercel serverless function: POST /api/chat
// Forwards messages to OpenAI / Groq / Ollama based on available env vars
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, model } = req.body || {}
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  try {
    const reply = await callLLM(messages, model)
    return res.status(200).json({ reply })
  } catch (err) {
    console.error('[chat] LLM error:', err.message)
    return res.status(500).json({ error: err.message || 'LLM request failed' })
  }
}

async function callLLM(messages, model) {
  // Priority: OpenAI → Groq → Ollama
  if (process.env.OPENAI_API_KEY) {
    return callOpenAI(messages, model || 'gpt-4o-mini')
  }
  if (process.env.GROQ_API_KEY) {
    return callGroq(messages, model || 'llama3-8b-8192')
  }
  if (process.env.OLLAMA_BASE_URL) {
    return callOllama(messages, model || 'llama3')
  }
  throw new Error('No LLM provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, or OLLAMA_BASE_URL.')
}

async function callOpenAI(messages, model) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model, messages }),
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI error ${response.status}: ${err}`)
  }
  const data = await response.json()
  return data.choices[0].message.content
}

async function callGroq(messages, model) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model, messages }),
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq error ${response.status}: ${err}`)
  }
  const data = await response.json()
  return data.choices[0].message.content
}

async function callOllama(messages, model) {
  const base = process.env.OLLAMA_BASE_URL.replace(/\/$/, '')
  const response = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false }),
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Ollama error ${response.status}: ${err}`)
  }
  const data = await response.json()
  return data.message?.content || data.response
}
