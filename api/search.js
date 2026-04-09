// Vercel serverless function: POST /api/search
// Web search / research queries routed through LLM with web browsing context
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, context } = req.body || {};
  if (!query) {
    return res.status(400).json({ error: 'query is required' });
  }

  // If no LLM configured, return synthetic response
  if (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY && !process.env.OLLAMA_BASE_URL) {
    return res.status(200).json({
      query,
      summary: `[Synthetic] Search query received: "${query}"\n\nNo LLM provider configured. Set OPENAI_API_KEY to enable live web research.`,
      sources: [],
      mode: 'synthetic',
    });
  }

  try {
    const systemPrompt = `You are the XPS Research Agent, an expert intelligence analyst.
Answer the research query with accurate, structured information.
Format your response clearly with key findings, data points, and relevant context.
${context ? `Additional context: ${context}` : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ];

    const summary = await callLLM(messages);
    return res.status(200).json({
      query,
      summary,
      sources: [], // Note: live web search requires additional browser tooling
      mode: 'live',
    });
  } catch (err) {
    console.error('[search] error:', err.message);
    return res.status(500).json({ error: err.message });
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
    });
    if (!response.ok) throw new Error(`OpenAI error ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content;
  }
  if (process.env.GROQ_API_KEY) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model: 'llama3-8b-8192', messages }),
    });
    if (!response.ok) throw new Error(`Groq error ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content;
  }
  throw new Error('No LLM provider configured.');
}
