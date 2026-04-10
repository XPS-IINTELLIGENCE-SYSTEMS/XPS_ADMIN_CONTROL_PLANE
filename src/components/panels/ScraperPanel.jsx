import React, { useState } from 'react';

const gold = '#d4a843';
const API_URL = import.meta.env.API_URL || '';

export default function ScraperPanel() {
  const [url, setUrl]         = useState('');
  const [prompt, setPrompt]   = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const entry = { url: url.trim(), summary: data.summary, ts: new Date().toISOString(), status: 'complete' };
      setResult(entry);
      setHistory(prev => [entry, ...prev.slice(0, 9)]);
      setUrl('');
      setPrompt('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 28px' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Web Scraper</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Fetch, extract, and summarise content from any public URL
        </p>
      </div>

      {/* Input form */}
      <div style={{
        background: '#161616',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '20px', marginBottom: 20,
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>
              TARGET URL
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              style={{
                width: '100%', padding: '10px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, color: '#fff', fontSize: 13,
              }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>
              EXTRACTION PROMPT <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="E.g. Extract all pricing information and key product details"
              style={{
                width: '100%', padding: '10px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, color: '#fff', fontSize: 13,
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            style={{
              padding: '10px 24px',
              background: (!loading && url.trim()) ? gold : 'rgba(255,255,255,0.06)',
              border: 'none', borderRadius: 8,
              color: (!loading && url.trim()) ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
              fontSize: 13, fontWeight: 700,
              cursor: (!loading && url.trim()) ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {loading ? (
              <>⏳ Scraping…</>
            ) : (
              <><span>🕷️</span> Scrape &amp; Summarise</>
            )}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: 16, padding: '12px 16px',
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 8, color: '#f87171', fontSize: 13,
        }}>
          ✕ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          marginBottom: 20,
          background: '#161616',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '18px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: '#4ade80' }}>COMPLETE</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>{result.url}</span>
          </div>
          <div style={{
            fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {result.summary}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
            SCRAPE HISTORY
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.slice(1).map((entry, i) => (
              <div key={i} style={{
                background: '#161616',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 12 }}>🕷️</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.url}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{entry.ts.split('T')[0]}</div>
                </div>
                <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 600 }}>DONE</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
