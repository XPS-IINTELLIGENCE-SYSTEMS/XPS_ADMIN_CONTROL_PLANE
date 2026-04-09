// Vercel serverless function: POST /api/agents/run
// Autonomous agent task execution — ByteBot and other agents
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { task, agent = 'bytebot', context = {}, history = [] } = req.body || {};
  if (!task) {
    return res.status(400).json({ error: 'task is required' });
  }

  const agentSystemPrompts = {
    bytebot:      `You are ByteBot, an autonomous multi-step task executor for the XPS Intelligence Command Center. Break down and execute the given task, returning clear progress steps and a final result summary. Be specific and actionable.`,
    orchestrator: `You are the XPS Orchestrator. Analyze the task, determine which capabilities are needed, and produce a structured execution plan with results.`,
    research:     `You are the XPS Research Agent. Research the given topic thoroughly and return structured findings.`,
    scraper:      `You are the XPS Scraper Agent. Analyze the scraping task and return a structured extraction plan.`,
    builder:      `You are the XPS Auto Builder. Generate code, configurations, or system structures based on the task description.`,
    default:      `You are an XPS Intelligence agent. Complete the given task and return clear, structured results.`,
  };

  const systemPrompt = agentSystemPrompts[agent] || agentSystemPrompts.default;

  // Synthetic fallback if no LLM
  if (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY && !process.env.OLLAMA_BASE_URL) {
    return res.status(200).json({
      task,
      agent,
      result: `[Synthetic] ${agent} received task: "${task}"\n\nNo LLM provider configured. Set OPENAI_API_KEY to enable live agent execution.\n\nTo run this live:\n1. Set OPENAI_API_KEY in your Vercel environment\n2. Redeploy\n3. Re-run this task`,
      steps: [
        { step: 1, label: 'Task received',     status: 'complete' },
        { step: 2, label: 'Analyzing task',    status: 'complete' },
        { step: 3, label: 'Backend offline',   status: 'skipped'  },
      ],
      mode: 'synthetic',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // keep last 10 for context
      { role: 'user', content: `Task: ${task}${context.url ? `\nURL: ${context.url}` : ''}${context.data ? `\nContext data: ${JSON.stringify(context.data).slice(0, 2000)}` : ''}` },
    ];

    const result = await callLLM(messages);
    return res.status(200).json({
      task,
      agent,
      result,
      steps: [
        { step: 1, label: 'Task received',  status: 'complete' },
        { step: 2, label: 'LLM executed',   status: 'complete' },
        { step: 3, label: 'Result ready',   status: 'complete' },
      ],
      mode: 'live',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[agents/run] error:', err.message);
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
      body: JSON.stringify({ model: 'gpt-4o', messages }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${err}`);
    }
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
      body: JSON.stringify({ model: 'llama3-70b-8192', messages }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq error ${response.status}: ${err}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  }
  if (process.env.OLLAMA_BASE_URL) {
    const base = process.env.OLLAMA_BASE_URL.replace(/\/$/, '');
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama3', messages, stream: false }),
    });
    if (!response.ok) throw new Error(`Ollama error ${response.status}`);
    const data = await response.json();
    return data.message?.content || data.response;
  }
  throw new Error('No LLM provider configured.');
}
