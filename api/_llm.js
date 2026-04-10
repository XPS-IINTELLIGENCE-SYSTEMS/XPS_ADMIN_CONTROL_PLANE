// Shared LLM caller for Vercel serverless functions
// Priority: OpenAI → Groq → Ollama

export async function callLLM(messages, { model, json = false } = {}) {
  if (process.env.OPENAI_API_KEY) {
    return callOpenAI(messages, model || process.env.OPENAI_MODEL || 'gpt-4o-mini', json);
  }
  if (process.env.GROQ_API_KEY) {
    // Note: json=true (response_format: json_object) is an OpenAI-only feature;
    // Groq and Ollama ignore this parameter and return plain text.
    return callGroq(messages, model || process.env.GROQ_MODEL || 'llama3-8b-8192');
  }
  if (process.env.GEMINI_API_KEY || process.env.GCP_GEMINI_KEY) {
    return callGemini(messages, model || process.env.GEMINI_MODEL || 'gemini-1.5-flash', json);
  }
  if (process.env.OLLAMA_BASE_URL) {
    return callOllama(messages, model || process.env.OLLAMA_MODEL || 'llama3');
  }
  throw new Error('No LLM provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, or OLLAMA_BASE_URL.');
}

export function llmMode() {
  if (process.env.OPENAI_API_KEY) return 'live';
  if (process.env.GROQ_API_KEY)   return 'live';
  if (process.env.GEMINI_API_KEY || process.env.GCP_GEMINI_KEY) return 'live';
  if (process.env.OLLAMA_BASE_URL) return 'local';
  return 'synthetic';
}

export function hasLLM() {
  return !!(process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.GCP_GEMINI_KEY || process.env.OLLAMA_BASE_URL);
}

export function connectorState() {
  return {
    supabase: { status: !!process.env.SUPABASE_URL ? 'connected' : 'not_connected', mode: !!process.env.SUPABASE_URL ? 'live' : 'blocked' },
    llm:      { status: hasLLM() ? 'connected' : 'not_connected', mode: llmMode() },
    openai:   { status: !!process.env.OPENAI_API_KEY ? 'connected' : 'not_connected', mode: !!process.env.OPENAI_API_KEY ? 'live' : 'blocked' },
    groq:     { status: !!process.env.GROQ_API_KEY ? 'connected' : 'not_connected', mode: !!process.env.GROQ_API_KEY ? 'live' : 'blocked' },
    gemini:   { status: !!(process.env.GEMINI_API_KEY || process.env.GCP_GEMINI_KEY) ? 'connected' : 'not_connected', mode: !!(process.env.GEMINI_API_KEY || process.env.GCP_GEMINI_KEY) ? 'live' : 'blocked' },
    ollama:   { status: !!process.env.OLLAMA_BASE_URL ? 'connected' : 'not_connected', mode: !!process.env.OLLAMA_BASE_URL ? 'local' : 'blocked' },
    hubspot:  { status: !!process.env.HUBSPOT_API_KEY ? 'connected' : 'not_connected', mode: !!process.env.HUBSPOT_API_KEY ? 'live' : 'blocked' },
    airtable: { status: !!process.env.AIRTABLE_API_KEY ? 'connected' : 'not_connected', mode: !!process.env.AIRTABLE_API_KEY ? 'live' : 'blocked' },
    browser:  { status: !!process.env.BROWSER_WORKER_URL ? 'connected' : 'not_connected', mode: !!process.env.BROWSER_WORKER_URL ? 'local' : 'blocked' },
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

async function callGemini(messages, model, json = false) {
  const key = process.env.GEMINI_API_KEY || process.env.GCP_GEMINI_KEY;
  const systemPreamble = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const filtered = messages.filter(m => m.role !== 'system');
  if (systemPreamble) {
    if (filtered.length > 0) {
      filtered[0] = { ...filtered[0], content: `${systemPreamble}\n\n${filtered[0].content}` };
    } else {
      filtered.push({ role: 'user', content: systemPreamble });
    }
  }

  const contents = filtered.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    generationConfig: {
      temperature: 0.4,
      response_mime_type: json ? 'application/json' : 'text/plain',
    },
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini error ${response.status}: ${err}`);
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
  return text;
}
