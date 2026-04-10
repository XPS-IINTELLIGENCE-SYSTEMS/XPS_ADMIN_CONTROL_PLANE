// Vercel serverless function: GET /api/health
import { getLlmState } from './_llm.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const llm = getLlmState(process.env)
  const supabaseConfigured = !!(process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY))

  res.status(200).json({
    status: 'ok',
    service: 'xps-admin-api',
    timestamp: new Date().toISOString(),
    runtime: process.env.VERCEL ? 'vercel' : process.env.NODE_ENV === 'production' ? 'node-production' : 'node-dev',
    apiRoutes: true,
    supabase: {
      configured: supabaseConfigured,
      mode: supabaseConfigured ? 'live' : 'blocked',
      reason: supabaseConfigured ? null : 'SUPABASE_URL and SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY must be set.',
    },
    llm,
  })
}
