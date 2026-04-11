const STORAGE_KEY = 'xps.connectionPrefs.v1';
const listeners = new Set();

const DEFAULTS = {
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  groqApiKey: '',
  groqModel: 'llama-3.3-70b-versatile',
  geminiApiKey: '',
  geminiModel: 'gemini-1.5-flash',
  ollamaBaseUrl: '',
  ollamaModel: 'llama3.1:8b',
  githubToken: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
  vercelToken: '',
  hubspotApiKey: '',
};

function readStorage() {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeStorage(next) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((listener) => listener(next));
}

export function getConnectionPrefs() {
  return readStorage();
}

export function updateConnectionPrefs(patch) {
  const next = { ...readStorage(), ...patch };
  writeStorage(next);
  return next;
}

export function resetConnectionPrefs(keys = null) {
  if (!keys) {
    writeStorage({ ...DEFAULTS });
    return { ...DEFAULTS };
  }
  const current = readStorage();
  const next = { ...current };
  keys.forEach((key) => {
    next[key] = DEFAULTS[key] ?? '';
  });
  writeStorage(next);
  return next;
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

