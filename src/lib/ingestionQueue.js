const STORAGE_KEY = 'xps.ingestion.queue.v1';
const listeners = new Set();

function canUseStorage() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function loadIngestionQueue() {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveIngestionQueue(items) {
  if (!canUseStorage()) return [];
  const next = Array.isArray(items) ? items : [];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener(next));
  return next;
}

export function prependIngestionQueue(items, limit = 12) {
  const nextItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const next = [...nextItems, ...loadIngestionQueue()].slice(0, limit);
  return saveIngestionQueue(next);
}

export function subscribeIngestionQueue(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
