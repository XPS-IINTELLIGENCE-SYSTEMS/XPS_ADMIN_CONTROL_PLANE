// Vercel serverless function: POST/GET /api/control
// Control plane actions — connector state, agent dispatch, workspace actions
import { llmMode, hasLLM, connectorState } from './_llm.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!['POST', 'GET'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ts = new Date().toISOString();

  if (req.method === 'GET') {
    return res.status(200).json({
      event_type:   'connector_state',
      status:       'ok',
      service:      'xps-control-plane',
      mode:         llmMode(),
      connectors:   connectorState(),
      capabilities: ['connector_status', 'agent_dispatch', 'workspace_action', 'runtime_settings', 'run_cancel'],
      timestamp:    ts,
    });
  }

  const { action, payload } = req.body || {};
  if (!action) {
    return res.status(400).json({ error: 'action is required' });
  }

  try {
    switch (action) {
      case 'connector_status': {
        const cs = connectorState();
        return res.status(200).json({
          event_type: 'connector_state',
          action,
          connectors: cs,
          mode:       llmMode(),
          timestamp:  ts,
          workspace_object: {
            type:    'runtime_state',
            title:   'Connector Status',
            content: formatConnectorStatus(cs),
            meta:    { connectors: cs, mode: llmMode() },
          },
        });
      }

      case 'runtime_settings': {
        return res.status(200).json({
          event_type:     'connector_state',
          action,
          dev_auth:       true,
          runtime_mode:   llmMode(),
          supabase_ready: !!process.env.SUPABASE_URL,
          llm_ready:      hasLLM(),
          timestamp:      ts,
        });
      }

      case 'blocked_capabilities': {
        const blocked = [];
        if (!process.env.OPENAI_API_KEY) blocked.push({ capability: 'openai', reason: 'OPENAI_API_KEY not set', required_env: ['OPENAI_API_KEY'] });
        if (!process.env.SUPABASE_URL)   blocked.push({ capability: 'supabase', reason: 'SUPABASE_URL not set', required_env: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] });
        if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) blocked.push({ capability: 'llm', reason: 'No LLM provider configured', required_env: ['OPENAI_API_KEY', 'GROQ_API_KEY'] });
        return res.status(200).json({
          event_type:         'blocked_capability',
          action,
          blocked_capabilities: blocked,
          mode:               llmMode(),
          timestamp:          ts,
          workspace_object: {
            type:    'runtime_state',
            title:   'Capability Report',
            content: blocked.length === 0
              ? '✓ All configured capabilities active.'
              : blocked.map(b => `⛔ ${b.capability}: ${b.reason}\n   Required: ${b.required_env.join(', ')}`).join('\n\n'),
            meta:    { blocked, mode: llmMode() },
          },
        });
      }

      case 'run_cancel': {
        // Acknowledge cancellation — actual ByteBot run cancellation is client-side
        return res.status(200).json({
          event_type: 'run_failed',
          action,
          run_id:     payload?.runId || null,
          status:     'cancelled',
          timestamp:  ts,
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

function formatConnectorStatus(cs) {
  return Object.entries(cs)
    .map(([name, { status, mode }]) => {
      const icon = status === 'connected' ? '✓' : '⛔';
      return `${icon} ${name}: ${status} (${mode})`;
    })
    .join('\n');
}
