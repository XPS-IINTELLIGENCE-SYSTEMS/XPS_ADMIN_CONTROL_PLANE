// Vercel serverless function: GET /api/health
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  res.status(200).json({
    status: 'ok',
    service: 'xps-admin-api',
    timestamp: new Date().toISOString(),
    supabase: !!process.env.SUPABASE_URL,
    llm: !!(process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.OLLAMA_BASE_URL),
  })
}
