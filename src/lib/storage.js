// Safe localStorage wrapper – silently degrades if storage is unavailable (SSR, private mode, quota)

const PREFIX = 'xps_';

function key(k) { return PREFIX + k; }

export const storage = {
  get(k, fallback = null) {
    try {
      const raw = localStorage.getItem(key(k));
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(k, value) {
    try {
      localStorage.setItem(key(k), JSON.stringify(value));
    } catch {
      // quota exceeded or unavailable – silently ignore
    }
  },
  remove(k) {
    try { localStorage.removeItem(key(k)); } catch { /* ignore */ }
  },
  clear() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch { /* ignore */ }
  },
};
