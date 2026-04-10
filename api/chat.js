// Vercel serverless function: POST /api/chat
// Returns a structured workspace render contract instead of freeform text.
import { callLLM, llmMode, hasLLM } from './_llm.js';

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

  const mode = llmMode();
  const attachmentNote = attachments.length
    ? `Attachment context:\n${attachments.map(a => `- ${a.name} (${a.type || 'file'}, ${Math.round((a.size || 0) / 1024)}kb)`).join('\n')}`
    : '';
  const promptMessages = attachmentNote ? [...messages, { role: 'system', content: attachmentNote }] : messages;

  if (provider === 'synthetic') {
    return res.status(200).json({
      event_type: 'run_completed',
      run_id:     runId || null,
      agent,
      mode:       'synthetic',
      reply: `[Synthetic] ${agent} received your message. Provider explicitly set to synthetic.`,
      workspace_object: {
        type:    'report',
        title:   'Synthetic Response',
        content: `[Synthetic] ${agent} — provider forced to synthetic mode.`,
      },
      steps: [
        { step: 1, label: 'Message received', status: 'complete' },
        { step: 2, label: 'Provider forced synthetic', status: 'complete' },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  if (!hasLLM()) {
    // Structured synthetic response
    return res.status(200).json({
      event_type: 'run_completed',
      run_id:     runId || null,
      agent,
      mode:       'synthetic',
      reply: `[Synthetic] ${agent} received your message. No LLM configured — set OPENAI_API_KEY to enable live responses.`,
      workspace_object: {
        type:    'report',
        title:   'Synthetic Response',
        content: `[Synthetic] ${agent} — no live backend configured.\n\nSet OPENAI_API_KEY in environment to enable live AI responses.`,
      },
      steps: [
        { step: 1, label: 'Message received',   status: 'complete' },
        { step: 2, label: 'LLM unavailable',    status: 'skipped'  },
        { step: 3, label: 'Synthetic fallback', status: 'complete' },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const reply = await callLLM(promptMessages, { model, provider })
    const wsType = inferWsType(reply, agent);

    return res.status(200).json({
      event_type: 'run_completed',
      run_id:     runId || null,
      agent,
      mode,
      reply,
      workspace_object: {
        type:    wsType,
        title:   deriveTitle(reply, agent),
        content: reply,
      },
      steps: [
        { step: 1, label: 'Message received', status: 'complete' },
        { step: 2, label: 'LLM executed',     status: 'complete' },
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
      mode,
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
