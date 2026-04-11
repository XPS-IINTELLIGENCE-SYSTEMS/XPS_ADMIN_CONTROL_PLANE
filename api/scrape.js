// Vercel serverless function: POST /api/scrape
// Fetches a URL and summarises / extracts structured data using LLM
// Returns structured scrape_result contract
import { callLLM, llmMode, hasLLM } from './_llm.js';

const MAX_CONTENT_LENGTH = 8000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url, prompt, runId, credentials = {} } = req.body || {}
  if (!url) {
    return res.status(400).json({ error: 'url is required' })
  }

  const mode = llmMode(credentials);
  const ts   = new Date().toISOString();

  try {
    // Fetch target page
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'XPS-Scraper/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (!pageRes.ok) {
      return res.status(502).json({
        event_type: 'run_failed',
        run_id:     runId || null,
        url,
        mode,
        error:     `Target URL returned ${pageRes.status}`,
        timestamp: ts,
      });
    }
    const html = await pageRes.text()

    const text = html
      .replace(/<script[\s\S]*?<\/script[\s]*>/gi, '')
      .replace(/<style[\s\S]*?<\/style[\s]*>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_CONTENT_LENGTH)

    if (!hasLLM(credentials)) {
      return res.status(200).json({
        event_type: 'scrape_result',
        run_id:     runId || null,
        url,
        summary:    `[Synthetic] Scraped ${url} — ${text.length} chars extracted. No LLM for summarization.`,
        raw_length: text.length,
        mode:       'synthetic',
        workspace_object: {
          type:    'scrape',
          title:   `Scrape: ${url.slice(0, 50)}`,
          content: text.slice(0, 1000),
          meta:    { url, raw_length: text.length, mode: 'synthetic' },
        },
        timestamp: ts,
      });
    }

    const systemPrompt = prompt || 'Extract the main content, key data points, and a brief summary from this web page.';
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: `URL: ${url}\n\nPage content:\n${text}` },
    ]

    const summary = await callLLM(messages, { credentials });

    return res.status(200).json({
      event_type: 'scrape_result',
      run_id:     runId || null,
      url,
      summary,
      raw_length: text.length,
      mode,
      workspace_object: {
        type:    'scrape',
        title:   `Scrape: ${url.slice(0, 50)}`,
        content: summary,
        meta:    { url, raw_length: text.length, mode },
      },
      timestamp: ts,
    });
  } catch (err) {
    console.error('[scrape] error:', err.message)
    return res.status(500).json({
      event_type: 'run_failed',
      run_id:     runId || null,
      url,
      mode,
      error:     err.message || 'Scrape failed',
      timestamp: ts,
    });
  }
}
