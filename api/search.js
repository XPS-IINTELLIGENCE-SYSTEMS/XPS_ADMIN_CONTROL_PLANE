// Vercel serverless function: POST /api/search
// Returns structured search_result contract
import { callLLM, llmMode, hasLLM } from './_llm.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, context, runId, credentials = {} } = req.body || {};
  if (!query) {
    return res.status(400).json({ error: 'query is required' });
  }

  const mode = llmMode(credentials);
  const ts   = new Date().toISOString();

  if (!hasLLM(credentials)) {
    return res.status(200).json({
      event_type: 'search_result',
      run_id:     runId || null,
      query,
      summary:    `[Synthetic] Search query received: "${query}"\n\nNo LLM provider configured. Set OPENAI_API_KEY to enable live web research.`,
      sources:    [],
      mode:       'synthetic',
      workspace_object: {
        type:    'search',
        title:   `Search: ${query.slice(0, 50)}`,
        content: `[Synthetic] Search for: ${query}\n\nNo live backend — set OPENAI_API_KEY.`,
        meta:    { query, sources: [], mode: 'synthetic' },
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

    const summary = await callLLM(messages, { credentials });

    return res.status(200).json({
      event_type: 'search_result',
      run_id:     runId || null,
      query,
      summary,
      sources:    [], // live web search requires additional browser tooling
      mode,
      workspace_object: {
        type:    'search',
        title:   `Search: ${query.slice(0, 50)}`,
        content: summary,
        meta:    { query, sources: [], mode },
      },
      timestamp: ts,
    });
  } catch (err) {
    console.error('[search] error:', err.message);
    return res.status(500).json({
      event_type: 'run_failed',
      run_id:     runId || null,
      query,
      mode,
      error:      err.message,
      timestamp:  ts,
    });
  }
}
