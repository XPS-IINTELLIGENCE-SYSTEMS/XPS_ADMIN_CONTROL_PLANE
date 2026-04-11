// Shared LLM caller for Vercel serverless functions
// Priority: OpenAI → Groq → Gemini → Ollama

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GCP_GEMINI_KEY;
}

const SUGGESTED_MODELS = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1-mini'],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  gemini: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
  ollama: ['llama3.1:8b', 'mistral:7b', 'qwen2.5:7b'],
};

function getRuntimeCredentials(env = process.env, credentials = {}) {
  return {
    openaiApiKey: credentials.openaiApiKey || env.OPENAI_API_KEY,
    groqApiKey: credentials.groqApiKey || env.GROQ_API_KEY,
    geminiApiKey: credentials.geminiApiKey || env.GEMINI_API_KEY || env.GCP_GEMINI_KEY,
    ollamaBaseUrl: credentials.ollamaBaseUrl || env.OLLAMA_BASE_URL,
  };
}

export function getProviderCatalog(env = process.env, credentials = {}) {
  const runtime = getRuntimeCredentials(env, credentials);
  const openaiModel = credentials.openaiModel || env.OPENAI_MODEL || 'gpt-4o-mini';
  const groqModel = credentials.groqModel || env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const geminiModel = credentials.geminiModel || env.GEMINI_MODEL || 'gemini-1.5-flash';
  const ollamaModel = credentials.ollamaModel || env.OLLAMA_MODEL || 'llama3.1:8b';
  return {
    openai: {
      configured: !!runtime.openaiApiKey,
      mode: runtime.openaiApiKey ? 'live' : 'blocked',
      model: openaiModel,
      availableModels: Array.from(new Set([openaiModel, ...SUGGESTED_MODELS.openai])),
      envKey: 'OPENAI_API_KEY',
      reason: runtime.openaiApiKey ? null : 'OPENAI_API_KEY not set.',
    },
    groq: {
      configured: !!runtime.groqApiKey,
      mode: runtime.groqApiKey ? 'live' : 'blocked',
      model: groqModel,
      availableModels: Array.from(new Set([groqModel, ...SUGGESTED_MODELS.groq])),
      envKey: 'GROQ_API_KEY',
      reason: runtime.groqApiKey ? null : 'GROQ_API_KEY not set.',
    },
    gemini: {
      configured: !!runtime.geminiApiKey,
      mode: runtime.geminiApiKey ? 'live' : 'blocked',
      model: geminiModel,
      availableModels: Array.from(new Set([geminiModel, ...SUGGESTED_MODELS.gemini])),
      envKey: 'GEMINI_API_KEY or GCP_GEMINI_KEY',
      reason: runtime.geminiApiKey ? null : 'GEMINI_API_KEY or GCP_GEMINI_KEY not set.',
    },
    ollama: {
      configured: !!runtime.ollamaBaseUrl,
      mode: runtime.ollamaBaseUrl ? 'local' : 'blocked',
      model: ollamaModel,
      availableModels: Array.from(new Set([ollamaModel, ...SUGGESTED_MODELS.ollama])),
      envKey: 'OLLAMA_BASE_URL',
      reason: runtime.ollamaBaseUrl ? null : 'OLLAMA_BASE_URL not set.',
    },
  };
}

export function getLlmState(env = process.env, credentials = {}) {
  const providers = getProviderCatalog(env, credentials);
  const activeEntry = Object.entries(providers).find(([, provider]) => provider.configured) || null;
  const active = activeEntry?.[0] || 'none';
  const activeProvider = activeEntry?.[1] || null;

  return {
    active,
    model: activeProvider?.model || null,
    mode: activeProvider?.mode || 'synthetic',
    reason: activeProvider?.reason || 'No LLM provider configured. Configure OPENAI_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, GCP_GEMINI_KEY, or OLLAMA_BASE_URL.',
    providers,
  };
}

export function resolveProviderRequest({ provider = 'auto', model, credentials = {} } = {}, env = process.env) {
  const requestedProvider = typeof provider === 'string' ? provider.toLowerCase() : 'auto';
  const llm = getLlmState(env, credentials);

  if (requestedProvider === 'synthetic') {
    return {
      ok: true,
      provider: 'synthetic',
      requestedProvider,
      model: model || 'fallback',
      mode: 'synthetic',
      explicitSynthetic: true,
      fallbackSynthetic: false,
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
        explicitSynthetic: false,
        fallbackSynthetic: false,
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
        explicitSynthetic: false,
        fallbackSynthetic: false,
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
      fallbackSynthetic: false,
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
      mode: 'synthetic',
      explicitSynthetic: false,
      fallbackSynthetic: true,
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
    fallbackSynthetic: false,
    reason: null,
    llm,
  };
}

export async function callLLM(messages, { model, provider = 'auto', json = false, credentials = {} } = {}) {
  const runtime = getRuntimeCredentials(process.env, credentials);
  const resolved = typeof provider === 'string' ? provider.toLowerCase() : 'auto';
  if (resolved !== 'auto') {
    switch (resolved) {
      case 'openai':
        if (!runtime.openaiApiKey) throw new Error('OpenAI provider not configured.');
        return callOpenAI(messages, model || process.env.OPENAI_MODEL || 'gpt-4o-mini', json, runtime.openaiApiKey);
      case 'groq':
        if (!runtime.groqApiKey) throw new Error('Groq provider not configured.');
        return callGroq(messages, model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', runtime.groqApiKey);
      case 'gemini': {
        if (!runtime.geminiApiKey) throw new Error('Gemini provider not configured.');
        return callGemini(messages, model || process.env.GEMINI_MODEL || 'gemini-1.5-flash', json, runtime.geminiApiKey);
      }
      case 'ollama':
        if (!runtime.ollamaBaseUrl) throw new Error('Ollama provider not configured.');
        return callOllama(messages, model || process.env.OLLAMA_MODEL || 'llama3.1:8b', runtime.ollamaBaseUrl);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  if (runtime.openaiApiKey) {
    return callOpenAI(messages, model || process.env.OPENAI_MODEL || 'gpt-4o-mini', json, runtime.openaiApiKey);
  }
  if (runtime.groqApiKey) {
    // Note: json=true (response_format: json_object) is an OpenAI-only feature;
    // Groq and Ollama ignore this parameter and return plain text.
    return callGroq(messages, model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', runtime.groqApiKey);
  }
  if (runtime.geminiApiKey) {
    return callGemini(messages, model || process.env.GEMINI_MODEL || 'gemini-1.5-flash', json, runtime.geminiApiKey);
  }
  if (runtime.ollamaBaseUrl) {
    return callOllama(messages, model || process.env.OLLAMA_MODEL || 'llama3.1:8b', runtime.ollamaBaseUrl);
  }
  throw new Error('No LLM provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, or OLLAMA_BASE_URL.');
}

export function llmMode(credentials = {}) {
  return getLlmState(process.env, credentials).mode;
}

export function hasLLM(credentials = {}) {
  return getLlmState(process.env, credentials).active !== 'none';
}

function buildConnectorState(configured, {
  modeWhenConfigured = 'live',
  reason = null,
  capabilityState = 'connected',
} = {}) {
  return {
    status: configured ? 'connected' : 'not_connected',
    mode: configured ? modeWhenConfigured : 'blocked',
    capability_state: configured ? capabilityState : 'blocked',
    reason: configured ? null : reason,
  };
}

export function connectorState(credentials = {}) {
  const llm = getLlmState(process.env, credentials);
  const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  const twilioWriteEnabled = !!(twilioConfigured && process.env.TWILIO_PHONE_NUMBER);
  const sendgridConfigured = !!process.env.SENDGRID_API_KEY;
  const sendgridWriteEnabled = !!(sendgridConfigured && process.env.SENDGRID_FROM_EMAIL);
  return {
    supabase: buildConnectorState(!!process.env.SUPABASE_URL, {
      reason: 'SUPABASE_URL not set.',
      capabilityState: 'connected',
    }),
    llm:      { status: hasLLM() ? 'connected' : 'not_connected', mode: llm.mode, active: llm.active, reason: llm.reason, capability_state: hasLLM() ? 'connected' : 'blocked' },
    openai:   { ...buildConnectorState(llm.providers.openai.configured, { reason: llm.providers.openai.reason, capabilityState: 'connected' }), mode: llm.providers.openai.mode },
    groq:     { ...buildConnectorState(llm.providers.groq.configured, { reason: llm.providers.groq.reason, capabilityState: 'connected' }), mode: llm.providers.groq.mode },
    gemini:   { ...buildConnectorState(llm.providers.gemini.configured, { reason: llm.providers.gemini.reason, capabilityState: 'connected' }), mode: llm.providers.gemini.mode },
    ollama:   { ...buildConnectorState(llm.providers.ollama.configured, { modeWhenConfigured: 'local', reason: llm.providers.ollama.reason, capabilityState: 'local-only' }), mode: llm.providers.ollama.mode },
    hubspot:  buildConnectorState(!!process.env.HUBSPOT_API_KEY, { reason: 'HUBSPOT_API_KEY not set.', capabilityState: 'token-configured' }),
    airtable: buildConnectorState(!!(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID), { reason: 'AIRTABLE_API_KEY or AIRTABLE_BASE_ID not set.', capabilityState: 'token-configured' }),
    browser:  buildConnectorState(!!process.env.BROWSER_WORKER_URL, { modeWhenConfigured: 'local', reason: 'BROWSER_WORKER_URL not set.', capabilityState: 'local-only' }),
    twilio:   buildConnectorState(twilioConfigured, { reason: 'TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set.', capabilityState: twilioWriteEnabled ? 'write-enabled' : 'token-configured' }),
    sendgrid: buildConnectorState(sendgridConfigured, { reason: 'SENDGRID_API_KEY not set.', capabilityState: sendgridWriteEnabled ? 'write-enabled' : 'token-configured' }),
  };
}

async function callOpenAI(messages, model, json = false, apiKey) {
  const body = { model, messages };
  if (json) body.response_format = { type: 'json_object' };
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGroq(messages, model, apiKey) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq error ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOllama(messages, model, baseUrl) {
  const base = baseUrl.replace(/\/$/, '');
  const response = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false }),
  });
  if (!response.ok) throw new Error(`Ollama error ${response.status}`);
  const data = await response.json();
  return data.message?.content || data.response;
}

async function callGemini(messages, model, json = false, key) {
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
