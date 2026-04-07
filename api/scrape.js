// Vercel serverless function: POST /api/scrape
// Fetches a URL and summarises / extracts structured data using LLM

// Max page content characters sent to LLM (keeps token usage reasonable)
const MAX_CONTENT_LENGTH = 8000
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url, prompt } = req.body || {}
  if (!url) {
    return res.status(400).json({ error: 'url is required' })
  }

  try {
    // Fetch target page
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'XPS-Scraper/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (!pageRes.ok) {
      return res.status(502).json({ error: `Target URL returned ${pageRes.status}` })
    }
    const html = await pageRes.text()

    // Strip HTML tags: first remove script/style blocks (with greedy multi-line match), then all remaining tags
    const text = html
      .replace(/<script[\s\S]*?<\/script[\s]*>/gi, '')
      .replace(/<style[\s\S]*?<\/style[\s]*>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_CONTENT_LENGTH)

    const systemPrompt = prompt || 'Extract the main content, key data points, and a brief summary from this web page.'
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `URL: ${url}\n\nPage content:\n${text}` },
    ]

    const summary = await callLLM(messages)
    return res.status(200).json({ url, summary })
  } catch (err) {
    console.error('[scrape] error:', err.message)
    return res.status(500).json({ error: err.message || 'Scrape failed' })
  }
}

async function callLLM(messages) {
  if (process.env.OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages }),
    })
    if (!response.ok) throw new Error(`OpenAI error ${response.status}`)
    const data = await response.json()
    return data.choices[0].message.content
  }
  if (process.env.GROQ_API_KEY) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model: 'llama3-8b-8192', messages }),
    })
    if (!response.ok) throw new Error(`Groq error ${response.status}`)
    const data = await response.json()
    return data.choices[0].message.content
  }
  if (process.env.OLLAMA_BASE_URL) {
    const base = process.env.OLLAMA_BASE_URL.replace(/\/$/, '')
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama3', messages, stream: false }),
    })
    if (!response.ok) throw new Error(`Ollama error ${response.status}`)
    const data = await response.json()
    return data.message?.content || data.response
  }
  throw new Error('No LLM provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, or OLLAMA_BASE_URL.')
}
