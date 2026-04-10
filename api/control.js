// Vercel serverless function: POST /api/control
// Control plane actions — route commands to backend services
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!['POST', 'GET'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'xps-control-plane',
      timestamp: new Date().toISOString(),
      capabilities: ['connector_status', 'agent_dispatch', 'workspace_action', 'runtime_settings'],
    });
  }

  const { action, payload } = req.body || {};
  if (!action) {
    return res.status(400).json({ error: 'action is required' });
  }

  try {
    switch (action) {
      case 'connector_status': {
        return res.status(200).json({
          action,
          result: {
            supabase:  !!process.env.SUPABASE_URL,
            llm:       !!(process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY),
            timestamp: new Date().toISOString(),
          },
        });
      }
      case 'runtime_settings': {
        return res.status(200).json({
          action,
          result: {
            dev_auth:      true,
            runtime_mode:  process.env.OPENAI_API_KEY ? 'live' : 'synthetic',
            supabase_ready: !!process.env.SUPABASE_URL,
          },
        });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('[control] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
