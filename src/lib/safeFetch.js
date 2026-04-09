// Safe fetch wrapper — never throws raw, returns structured result
export async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: text || `HTTP ${res.status}`, data: null };
    }
    const data = await res.json().catch(() => null);
    return { ok: true, status: res.status, error: null, data };
  } catch (err) {
    return { ok: false, status: 0, error: err.message, data: null };
  }
}

// Safe JSON parse
export function safeJSON(str, fallback = null) {
  try { return JSON.parse(str); } catch { return fallback; }
}
