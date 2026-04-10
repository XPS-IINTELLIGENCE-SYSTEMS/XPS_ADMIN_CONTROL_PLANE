// Shared LLM caller for Vercel serverless functions
// Priority: OpenAI → Groq → Gemini → Ollama

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GCP_GEMINI_KEY;
}

export function getProviderCatalog(env = process.env) {
  const geminiKey = env.GEMINI_API_KEY || env.GCP_GEMINI_KEY;
  return {
    openai: {
      configured: !!env.OPENAI_API_KEY,
      mode: env.OPENAI_API_KEY ? 'live' : 'blocked',
      model: env.OPENAI_MODEL || 'gpt-4o-mini',
      envKey: 'OPENAI_API_KEY',
      reason: env.OPENAI_API_KEY ? null : 'OPENAI_API_KEY not set.',
    },
    groq: {
      configured: !!env.GROQ_API_KEY,
      mode: env.GROQ_API_KEY ? 'live' : 'blocked',
      model: env.GROQ_MODEL || 'llama3-8b-8192',
      envKey: 'GROQ_API_KEY',
      reason: env.GROQ_API_KEY ? null : 'GROQ_API_KEY not set.',
    },
    gemini: {
      configured: !!geminiKey,
      mode: geminiKey ? 'live' : 'blocked',
      model: env.GEMINI_MODEL || 'gemini-1.5-flash',
      envKey: env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'GEMINI_API_KEY or GCP_GEMINI_KEY',
      reason: geminiKey ? null : 'GEMINI_API_KEY or GCP_GEMINI_KEY not set.',
    },
    ollama: {
      configured: !!env.OLLAMA_BASE_URL,
      mode: env.OLLAMA_BASE_URL ? 'local' : 'blocked',
      model: env.OLLAMA_MODEL || 'llama3',
      envKey: 'OLLAMA_BASE_URL',
      reason: env.OLLAMA_BASE_URL ? null : 'OLLAMA_BASE_URL not set.',
    },
  };
}

export function getLlmState(env = process.env) {
  const providers = getProviderCatalog(env);
  const activeEntry = Object.entries(providers).find(([, provider]) => provider.configured) || null;
  const active = activeEntry?.[0] || 'none';
  const activeProvider = activeEntry?.[1] || null;

  return {
    active,
    model: activeProvider?.model || null,
    mode: activeProvider?.mode || 'blocked',
    reason: activeProvider?.reason || 'No LLM provider configured. Configure OPENAI_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, GCP_GEMINI_KEY, or OLLAMA_BASE_URL.',
    providers,
  };
}

export function resolveProviderRequest({ provider = 'auto', model } = {}, env = process.env) {
  const requestedProvider = typeof provider === 'string' ? provider.toLowerCase() : 'auto';
  const llm = getLlmState(env);

  if (requestedProvider === 'synthetic') {
    return {
      ok: true,
      provider: 'synthetic',
      requestedProvider,
      model: model || 'fallback',
      mode: 'synthetic',
      explicitSynthetic: true,
      reason: 'Provider explicitly set to synthetic.',
      llm,
    };
  }

  if (requestedProvider !== 'auto') {
    const requested = llm.providers[requestedProvider];
    if (!requested) {
      return {
        ok: false,
        provider: requestedProvider,
        requestedProvider,
        model: model || null,
        mode: 'blocked',
        reason: `Unknown provider: ${provider}`,
        llm,
      };
    }
    if (!requested.configured) {
      return {
        ok: false,
        provider: requestedProvider,
        requestedProvider,
        model: model || requested.model,
        mode: 'blocked',
        reason: requested.reason,
        llm,
      };
    }
    return {
      ok: true,
      provider: requestedProvider,
      requestedProvider,
      model: model || requested.model,
      mode: requested.mode,
      explicitSynthetic: false,
      reason: null,
      llm,
    };
  }

  if (llm.active === 'none') {
    return {
      ok: false,
      provider: 'none',
      requestedProvider,
      model: model || null,
      mode: 'blocked',
      reason: llm.reason,
      llm,
    };
  }

  return {
    ok: true,
    provider: llm.active,
    requestedProvider,
    model: model || llm.model,
    mode: llm.mode,
    explicitSynthetic: false,
    reason: null,
    llm,
  };
}

export async function callLLM(messages, { model, provider = 'auto', json = false } = {}) {
  const resolved = typeof provider === 'string' ? provider.toLowerCase() : 'auto';
  if (resolved !== 'auto') {
    switch (resolved) {
      case 'openai':
        if (!process.env.OPENAI_API_KEY) throw new Error('OpenAI provider not configured.');
        return callOpenAI(messages, model || process.env.OPENAI_MODEL || 'gpt-4o-mini', json);
      case 'groq':
        if (!process.env.GROQ_API_KEY) throw new Error('Groq provider not configured.');
        return callGroq(messages, model || process.env.GROQ_MODEL || 'llama3-8b-8192');
      case 'gemini': {
        const geminiKey = getGeminiApiKey();
        if (!geminiKey) throw new Error('Gemini provider not configured.');
        return callGemini(messages, model || process.env.GEMINI_MODEL || 'gemini-1.5-flash', json);
      }
      case 'ollama':
        if (!process.env.OLLAMA_BASE_URL) throw new Error('Ollama provider not configured.');
        return callOllama(messages, model || process.env.OLLAMA_MODEL || 'llama3');
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    return callOpenAI(messages, model || process.env.OPENAI_MODEL || 'gpt-4o-mini', json);
  }
  if (process.env.GROQ_API_KEY) {
    // Note: json=true (response_format: json_object) is an OpenAI-only feature;
    // Groq and Ollama ignore this parameter and return plain text.
    return callGroq(messages, model || process.env.GROQ_MODEL || 'llama3-8b-8192');
  }
  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    return callGemini(messages, model || process.env.GEMINI_MODEL || 'gemini-1.5-flash', json);
  }
  if (process.env.OLLAMA_BASE_URL) {
    return callOllama(messages, model || process.env.OLLAMA_MODEL || 'llama3');
  }
  throw new Error('No LLM provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, or OLLAMA_BASE_URL.');
}

export function llmMode() {
  // Legacy helper kept for routes/components that only need coarse runtime mode.
  if (process.env.OPENAI_API_KEY) return 'live';
  if (process.env.GROQ_API_KEY)   return 'live';
  if (process.env.GEMINI_API_KEY || process.env.GCP_GEMINI_KEY) return 'live';
  if (process.env.OLLAMA_BASE_URL) return 'local';
  return 'blocked';
}

export function hasLLM() {
  return !!(process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.GCP_GEMINI_KEY || process.env.OLLAMA_BASE_URL);
}

export function connectorState() {
  const llm = getLlmState();
  return {
    supabase: { status: !!process.env.SUPABASE_URL ? 'connected' : 'not_connected', mode: !!process.env.SUPABASE_URL ? 'live' : 'blocked' },
    llm:      { status: hasLLM() ? 'connected' : 'not_connected', mode: llm.mode, active: llm.active, reason: llm.reason },
    openai:   { status: llm.providers.openai.configured ? 'connected' : 'not_connected', mode: llm.providers.openai.mode, reason: llm.providers.openai.reason },
    groq:     { status: llm.providers.groq.configured ? 'connected' : 'not_connected', mode: llm.providers.groq.mode, reason: llm.providers.groq.reason },
    gemini:   { status: llm.providers.gemini.configured ? 'connected' : 'not_connected', mode: llm.providers.gemini.mode, reason: llm.providers.gemini.reason },
    ollama:   { status: llm.providers.ollama.configured ? 'connected' : 'not_connected', mode: llm.providers.ollama.mode, reason: llm.providers.ollama.reason },
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
  const key = getGeminiApiKey();
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
