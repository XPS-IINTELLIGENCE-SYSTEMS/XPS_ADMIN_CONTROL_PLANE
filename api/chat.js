// Vercel serverless function: POST /api/chat
// Returns a structured workspace render contract instead of freeform text.
import { callLLM, resolveProviderRequest } from './_llm.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, model, provider, agent = 'orchestrator', runId, attachments = [] } = req.body || {}
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  const routing = resolveProviderRequest({ provider, model });
  const mode = routing.mode;
  const attachmentNote = attachments.length
    ? `Attachment context:\n${attachments.map(a => `- ${a.name} (${a.type || 'file'}, ${Math.round((a.size || 0) / 1024)}kb)`).join('\n')}`
    : '';
  const promptMessages = attachmentNote ? [...messages, { role: 'system', content: attachmentNote }] : messages;

  if (routing.explicitSynthetic) {
    return res.status(200).json({
      event_type: 'run_completed',
      run_id:     runId || null,
      agent,
      provider:   routing.provider,
      model:      routing.model,
      mode:       routing.mode,
      reply: `[Synthetic] ${agent} received your message. Provider explicitly set to synthetic.`,
      workspace_object: {
        type:    'report',
        title:   'Synthetic Response',
        content: `[Synthetic] ${agent} — provider forced to synthetic mode.`,
        meta:    { provider: routing.provider, model: routing.model, mode: routing.mode, reason: routing.reason },
      },
      steps: [
        { step: 1, label: 'Message received', status: 'complete' },
        { step: 2, label: 'Provider forced synthetic', status: 'complete' },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  if (!routing.ok) {
    return res.status(200).json({
      event_type: 'run_blocked',
      run_id:     runId || null,
      agent,
      provider:   routing.provider,
      model:      routing.model,
      mode:       'blocked',
      blocked_reason: routing.reason,
      reply: `Blocked: ${routing.reason}`,
      workspace_object: {
        type:    'runtime_state',
        title:   'Provider Blocked',
        content: `Chat request blocked.\n\nReason: ${routing.reason}`,
        meta:    { provider: routing.provider, model: routing.model, mode: 'blocked', reason: routing.reason },
      },
      steps: [
        { step: 1, label: 'Message received',   status: 'complete' },
        { step: 2, label: 'Provider routing resolved', status: 'complete' },
        { step: 3, label: 'Blocked — provider unavailable', status: 'blocked' },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const reply = await callLLM(promptMessages, { model: routing.model, provider: routing.provider })
    const wsType = inferWsType(reply, agent);

    return res.status(200).json({
      event_type: 'run_completed',
      run_id:     runId || null,
      agent,
      provider:   routing.provider,
      model:      routing.model,
      mode:       routing.mode,
      reply,
      workspace_object: {
        type:    wsType,
        title:   deriveTitle(reply, agent),
        content: reply,
        meta:    { provider: routing.provider, model: routing.model, mode: routing.mode },
      },
      steps: [
        { step: 1, label: 'Message received', status: 'complete' },
        { step: 2, label: `Provider routed: ${routing.provider}`, status: 'complete' },
        { step: 3, label: 'Result ready',     status: 'complete' },
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[chat] LLM error:', err.message)
    return res.status(500).json({
      event_type: 'run_failed',
      run_id:     runId || null,
      agent,
      provider:   routing.provider,
      model:      routing.model,
      mode:       routing.mode,
      error:      err.message || 'LLM request failed',
      timestamp:  new Date().toISOString(),
    });
  }
}

function inferWsType(reply, agentId) {
  if (!reply) return 'report';
  if (reply.includes('```')) return 'code';
  const lower = reply.toLowerCase();
  if (agentId === 'builder' || lower.includes('<html') || lower.includes('component')) return 'ui';
  if (agentId === 'bytebot' || lower.includes('step ') || lower.includes('task completed')) return 'agent_run';
  if (agentId === 'scraper' || lower.includes('scrape') || lower.includes('extracted')) return 'scrape';
  if (agentId === 'research' || lower.includes('search result') || lower.includes('web search')) return 'search';
  if (lower.includes('"items"') || lower.includes('[{')) return 'data';
  return 'report';
}

function deriveTitle(content, agentId) {
  const fallback = `${agentId ?? 'agent'} output`;
  if (!content) return fallback;
  const firstLine = content.split('\n').find(l => l.trim())?.replace(/^#+\s*/, '').replace(/^```\w*/, '').trim() ?? '';
  if (!firstLine) return fallback;
  return firstLine.length > 60 ? firstLine.slice(0, 60) + '…' : firstLine;
}
