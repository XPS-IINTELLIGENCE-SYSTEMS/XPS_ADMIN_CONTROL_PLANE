const LOCAL_STORAGE_KEY = 'xps.connectionPrefs.persisted.v2';
const SESSION_STORAGE_KEY = 'xps.connectionPrefs.session.v2';
const listeners = new Set();

const DEFAULTS = {
  openaiApiKey: '',
  openaiOrgId: '',
  openaiBaseUrl: '',
  openaiModel: 'gpt-4o-mini',
  groqApiKey: '',
  groqBaseUrl: '',
  groqModel: 'llama-3.3-70b-versatile',
  geminiApiKey: '',
  geminiProjectId: '',
  geminiModel: 'gemini-1.5-flash',
  ollamaBaseUrl: '',
  ollamaModel: 'llama3.1:8b',
  githubToken: '',
  githubRepoOwner: '',
  githubRepoName: '',
  githubRepoBranch: 'main',
  githubWorkflowFile: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
  vercelToken: '',
  vercelProjectId: '',
  vercelTeamId: '',
  vercelDeployHookUrl: '',
  hubspotApiKey: '',
  airtableApiKey: '',
  airtableBaseId: '',
  googleWorkspaceCustomerId: '',
  googleWorkspaceAdminEmail: '',
  googleCloudProjectId: '',
  googleCloudRegion: '',
  browserWorkerUrl: '',
  localRuntimeUrl: '',
  cloudRuntimeUrl: '',
  runtimeTarget: 'local',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioPhoneNumber: '',
  twilioWebhookUrl: '',
  sendgridApiKey: '',
  sendgridFromEmail: '',
  sendgridWebhookUrl: '',
  genericWebhookUrl: '',
  repoTarget: '',
  deploymentTarget: 'preview',
  providerPreference: 'auto',
  bytebotProvider: 'auto',
};

function getStorage(scope) {
  if (typeof window === 'undefined') return null;
  return scope === 'session' ? window.sessionStorage : window.localStorage;
}

function sanitizePatch(patch = {}) {
  return Object.fromEntries(
    Object.entries(patch).filter(([key]) => Object.prototype.hasOwnProperty.call(DEFAULTS, key)),
  );
}

function readScopedStorage(scope) {
  const storage = getStorage(scope);
  if (!storage) return {};
  try {
    const raw = storage.getItem(scope === 'session' ? SESSION_STORAGE_KEY : LOCAL_STORAGE_KEY);
    if (!raw) return {};
    return sanitizePatch(JSON.parse(raw));
  } catch {
    return {};
  }
}

function writeScopedStorage(scope, next) {
  const storage = getStorage(scope);
  if (storage) {
    storage.setItem(scope === 'session' ? SESSION_STORAGE_KEY : LOCAL_STORAGE_KEY, JSON.stringify(sanitizePatch(next)));
  }
}

function removeScopedKeys(scope, keys = null) {
  const current = readScopedStorage(scope);
  if (!keys) {
    writeScopedStorage(scope, {});
    return;
  }
  const next = { ...current };
  keys.forEach((key) => {
    delete next[key];
  });
  writeScopedStorage(scope, next);
}

function buildMergedPrefs() {
  const persisted = readScopedStorage('persisted');
  const session = readScopedStorage('session');
  return {
    ...DEFAULTS,
    ...persisted,
    ...session,
  };
}

function buildMeta() {
  const persisted = readScopedStorage('persisted');
  const session = readScopedStorage('session');
  return Object.fromEntries(
    Object.keys(DEFAULTS).map((key) => [
      key,
      session[key]
        ? 'session'
        : persisted[key]
          ? 'persisted'
          : 'default',
    ]),
  );
}

function notify() {
  const next = buildMergedPrefs();
  listeners.forEach((listener) => listener(next));
}

export function getConnectionPrefs() {
  return buildMergedPrefs();
}

export function getConnectionPrefMeta() {
  return buildMeta();
}

export function getConnectionPrefSource(key) {
  return buildMeta()[key] || 'default';
}

export function updateConnectionPrefs(patch, options = {}) {
  const scope = options.scope === 'session' ? 'session' : 'persisted';
  const current = readScopedStorage(scope);
  const next = { ...current, ...sanitizePatch(patch) };
  writeScopedStorage(scope, next);
  notify();
  return buildMergedPrefs();
}

export function resetConnectionPrefs(keys = null, options = {}) {
  const scope = options.scope || 'all';
  if (scope === 'session' || scope === 'persisted') {
    removeScopedKeys(scope, keys);
    notify();
    return buildMergedPrefs();
  }
  removeScopedKeys('session', keys);
  removeScopedKeys('persisted', keys);
  notify();
  return buildMergedPrefs();
}

export function subscribeConnectionPrefs(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function maskSecret(value) {
  if (!value) return 'not set';
  if (value.length <= 8) return 'configured';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}
