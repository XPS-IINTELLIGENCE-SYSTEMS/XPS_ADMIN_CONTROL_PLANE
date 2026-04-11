const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  groq: 'llama-3.3-70b-versatile',
  gemini: 'gemini-1.5-flash',
  ollama: 'llama3.1:8b',
};

function getConfiguredSource(apiConfigured, sessionConfigured, envConfigured) {
  if (apiConfigured) return 'backend';
  if (sessionConfigured) return 'session';
  if (envConfigured) return 'build';
  return 'none';
}

function buildProvider(provider, apiProvider = {}, { sessionValue, sessionModel, envValue, envModel, mode = 'live', missingReason }) {
  const apiConfigured = !!apiProvider?.configured;
  const sessionConfigured = !!sessionValue;
  const envConfigured = !!envValue;
  const configured = apiConfigured || sessionConfigured || envConfigured;
  const source = getConfiguredSource(apiConfigured, sessionConfigured, envConfigured);

  return {
    configured,
    model: apiProvider?.model || sessionModel || envModel || DEFAULT_MODELS[provider],
    mode: configured ? (provider === 'ollama' ? 'local' : mode) : 'blocked',
    reason: configured ? null : missingReason,
    source,
  };
}

export function resolveClientProviderState(apiState = null, connectionPrefs = {}) {
  const env = import.meta.env;
  const apiProviders = apiState?.llm?.providers || {};

  const providers = {
    openai: buildProvider('openai', apiProviders.openai, {
      sessionValue: connectionPrefs.openaiApiKey,
      sessionModel: connectionPrefs.openaiModel,
      envValue: env.OPENAI_API_KEY,
      envModel: env.OPENAI_MODEL,
      missingReason: 'Missing OPENAI_API_KEY or session API key.',
    }),
    groq: buildProvider('groq', apiProviders.groq, {
      sessionValue: connectionPrefs.groqApiKey,
      sessionModel: connectionPrefs.groqModel,
      envValue: env.GROQ_API_KEY,
      envModel: env.GROQ_MODEL,
      missingReason: 'Missing GROQ_API_KEY or session API key.',
    }),
    gemini: buildProvider('gemini', apiProviders.gemini, {
      sessionValue: connectionPrefs.geminiApiKey,
      sessionModel: connectionPrefs.geminiModel,
      envValue: env.GEMINI_API_KEY || env.GCP_GEMINI_KEY,
      envModel: env.GEMINI_MODEL,
      missingReason: 'Missing GEMINI_API_KEY / GCP_GEMINI_KEY or session API key.',
    }),
    ollama: buildProvider('ollama', apiProviders.ollama, {
      sessionValue: connectionPrefs.ollamaBaseUrl,
      sessionModel: connectionPrefs.ollamaModel,
      envValue: env.OLLAMA_BASE_URL,
      envModel: env.OLLAMA_MODEL,
      missingReason: 'Missing OLLAMA_BASE_URL or session base URL.',
    }),
  };

  const activeFromApi = apiState?.llm?.active;
  const resolvedActive = activeFromApi && activeFromApi !== 'none' && providers[activeFromApi]?.configured
    ? activeFromApi
    : ['openai', 'groq', 'gemini', 'ollama'].find((key) => providers[key].configured) || 'none';

  return {
    llm: {
      active: resolvedActive,
      model: resolvedActive === 'none' ? null : providers[resolvedActive].model,
      mode: resolvedActive === 'none' ? 'synthetic' : providers[resolvedActive].mode,
      reason: resolvedActive === 'none'
        ? 'No live provider configured. Synthetic fallback is active until a backend or session credential is supplied.'
        : null,
      providers,
    },
  };
}

export function resolveEffectiveConnectorConfig(liveConfigured, sessionConfigured = false) {
  return !!(liveConfigured || sessionConfigured);
}
