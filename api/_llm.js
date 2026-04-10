// Shared LLM caller for Vercel serverless functions
// Priority: OpenAI → Groq → Ollama

export async function callLLM(messages, { model, json = false } = {}) {
  if (process.env.OPENAI_API_KEY) {
    return callOpenAI(messages, model || 'gpt-4o-mini', json);
  }
  if (process.env.GROQ_API_KEY) {
    // Note: json=true (response_format: json_object) is an OpenAI-only feature;
    // Groq and Ollama ignore this parameter and return plain text.
    return callGroq(messages, model || 'llama3-8b-8192');
  }
  if (process.env.OLLAMA_BASE_URL) {
    return callOllama(messages, model || 'llama3');
  }
  throw new Error('No LLM provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, or OLLAMA_BASE_URL.');
}

export function llmMode() {
  if (process.env.OPENAI_API_KEY) return 'live';
  if (process.env.GROQ_API_KEY)   return 'live';
  if (process.env.OLLAMA_BASE_URL) return 'local';
  return 'synthetic';
}

export function hasLLM() {
  return !!(process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.OLLAMA_BASE_URL);
}

export function connectorState() {
  return {
    supabase: { status: !!process.env.SUPABASE_URL ? 'connected' : 'not_connected', mode: !!process.env.SUPABASE_URL ? 'live' : 'blocked' },
    llm:      { status: hasLLM() ? 'connected' : 'not_connected', mode: llmMode() },
    openai:   { status: !!process.env.OPENAI_API_KEY ? 'connected' : 'not_connected', mode: !!process.env.OPENAI_API_KEY ? 'live' : 'blocked' },
    groq:     { status: !!process.env.GROQ_API_KEY ? 'connected' : 'not_connected', mode: !!process.env.GROQ_API_KEY ? 'live' : 'blocked' },
    ollama:   { status: !!process.env.OLLAMA_BASE_URL ? 'connected' : 'not_connected', mode: !!process.env.OLLAMA_BASE_URL ? 'local' : 'blocked' },
  };
}

async function callOpenAI(messages, model, json = false) {
  const body = { model, messages };
  if (json) body.response_format = { type: 'json_object' };
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGroq(messages, model) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({ model, messages }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq error ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOllama(messages, model) {
  const base = process.env.OLLAMA_BASE_URL.replace(/\/$/, '');
  const response = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false }),
  });
  if (!response.ok) throw new Error(`Ollama error ${response.status}`);
  const data = await response.json();
  return data.message?.content || data.response;
}
