// Vercel serverless function: POST /api/search
// Returns structured search_result contract
import { callLLM, resolveProviderRequest } from './_llm.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, context, runId, provider = 'auto', model } = req.body || {};
  if (!query) {
    return res.status(400).json({ error: 'query is required' });
  }

  const routing = resolveProviderRequest({ provider, model });
  const mode = routing.mode;
  const ts   = new Date().toISOString();

  if (!routing.ok) {
    return res.status(200).json({
      event_type: 'search_blocked',
      run_id:     runId || null,
      query,
      provider:   routing.provider,
      model:      routing.model,
      summary:    `Search blocked: ${routing.reason}`,
      sources:    [],
      mode:       'blocked',
      blocked_reason: routing.reason,
      workspace_object: {
        type:    'runtime_state',
        title:   `Search: ${query.slice(0, 50)}`,
        content: `Search request blocked.\n\nQuery: ${query}\nReason: ${routing.reason}`,
        meta:    { query, sources: [], mode: 'blocked', provider: routing.provider, model: routing.model, reason: routing.reason },
      },
      timestamp: ts,
    });
  }

  try {
    const systemPrompt = `You are the XPS Research Agent, an expert intelligence analyst.
Answer the research query with accurate, structured information.
Format your response clearly with key findings, data points, and relevant context.
${context ? `Additional context: ${context}` : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: query },
    ];

    const summary = await callLLM(messages, { provider: routing.provider, model: routing.model });

    return res.status(200).json({
      event_type: 'search_result',
      run_id:     runId || null,
      query,
      provider:   routing.provider,
      model:      routing.model,
      summary,
      sources:    [], // live web search requires additional browser tooling
      mode,
      workspace_object: {
        type:    'search',
        title:   `Search: ${query.slice(0, 50)}`,
        content: summary,
        meta:    { query, sources: [], mode, provider: routing.provider, model: routing.model },
      },
      timestamp: ts,
    });
  } catch (err) {
    console.error('[search] error:', err.message);
    return res.status(500).json({
      event_type: 'run_failed',
      run_id:     runId || null,
      query,
      provider:   routing.provider,
      model:      routing.model,
      mode,
      error:      err.message,
      timestamp:  ts,
    });
  }
}
